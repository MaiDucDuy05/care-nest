import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import { JwtService } from '@nestjs/jwt';

/**
 * Socket.IO gateway for real-time alert push (<5s latency target).
 *
 * Auth: clients send a JWT in the `auth.token` field at handshake. We
 * extract `sub` (userId) and join them to `user:{userId}` room. Alerts
 * are broadcast to the subject's room.
 *
 * Phase 1: single-process in-memory adapter. Phase 2 will plug in
 * the Socket.IO Redis adapter for horizontal scaling.
 */
@Injectable()
export class RealtimeGateway implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RealtimeGateway.name);
  private io: Server | null = null;
  private httpServer: HttpServer | null = null;

  constructor(private readonly jwtService: JwtService) {}

  attach(httpServer: HttpServer) {
    this.httpServer = httpServer;
    this.initSocketServer();
  }

  async onModuleInit() {
    this.initSocketServer();
  }

  private initSocketServer() {
    if (!this.httpServer || this.io) return;
    this.io = new Server(this.httpServer, {
      path: '/alerts',
      cors: { origin: '*' },
    });

    this.io.use(async (socket: Socket, next) => {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No auth token'));
      try {
        const payload: any = await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_SECRET || 'care-nest-jwt-secret-dev-2026',
        });
        (socket as any).userId = payload.sub;
        next();
      } catch {
        next(new Error('Invalid token'));
      }
    });

    this.io.on('connection', (socket) => {
      const userId = (socket as any).userId;
      if (userId) {
        socket.join(`user:${userId}`);
        this.logger.log(`WS client connected for user:${userId}`);
      }
    });

    this.logger.log('Realtime gateway ready at /alerts');
  }

  async onModuleDestroy() {
    try { this.io?.close(); } catch { /* swallow */ }
  }

  broadcastToSubject(subjectId: string, event: string, payload: unknown): void {
    if (!this.io) return;
    this.io.to(`user:${subjectId}`).emit(event, payload);
  }
}
