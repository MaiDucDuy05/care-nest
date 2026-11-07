import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import { JwtService } from '@nestjs/jwt';
import { getPrismaClient, listCaregiverIdsFor } from '@carenest/database';

const CAREGIVER_CACHE_TTL_MS = 60 * 1000;

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
  private readonly caregiverCache = new Map<string, { ids: string[]; expiresAt: number }>();

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

      // TODO(vitals-realtime): web-buyer's useRealtimeVitals hook connects to
      // this same socket and emits `join {room: 'subject:'+userId}`, but there
      // is no handler for a 'join' event here, and nothing in this codebase
      // ever emits 'vitals:update' — the vitals-push feature is dead/unbuilt.
      // Not a live access-control gap (confirmed during the caregiver UI
      // security review), just flagged for whoever builds real vitals push.
    });

    this.logger.log('Realtime gateway ready at /alerts');
  }

  async onModuleDestroy() {
    try { this.io?.close(); } catch { /* swallow */ }
  }

  broadcastToSubject(subjectId: string, event: string, payload: unknown): void {
    if (!this.io) return;
    this.io.to(`user:${subjectId}`).emit(event, payload);
    // Fan out to accepted caregivers with receiveAlerts — cached 60s so a
    // burst of alerts for the same subject doesn't hammer the DB. A
    // revoked caregiver may still receive events for up to that TTL;
    // accepted tradeoff (no cross-service cache invalidation on revoke).
    void this.getCaregiverIds(subjectId).then((ids) => {
      for (const caretakerId of ids) {
        this.io?.to(`user:${caretakerId}`).emit(event, payload);
      }
    });
  }

  private async getCaregiverIds(subjectId: string): Promise<string[]> {
    const cached = this.caregiverCache.get(subjectId);
    if (cached && cached.expiresAt > Date.now()) return cached.ids;
    try {
      const ids = await listCaregiverIdsFor(getPrismaClient(), subjectId, 'receiveAlerts');
      this.caregiverCache.set(subjectId, { ids, expiresAt: Date.now() + CAREGIVER_CACHE_TTL_MS });
      return ids;
    } catch (err: any) {
      this.logger.warn(`Failed to resolve caregivers for ${subjectId}: ${err.message}`);
      return [];
    }
  }
}
