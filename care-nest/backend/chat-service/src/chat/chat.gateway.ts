import { Injectable, Logger, OnModuleInit, OnModuleDestroy, forwardRef, Inject } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service.js';
import type { SendMessageDto } from './dto/chat.dto.js';

@Injectable()
export class ChatGateway implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ChatGateway.name);
  private io: Server | null = null;
  private httpServer: HttpServer | null = null;

  constructor(
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
  ) {}

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
      path: '/chat',
      cors: { origin: '*' },
    });

    this.io.use(async (socket: Socket, next) => {
      const token = socket.handshake.auth?.token;
      if (!token) {
        // Fallback for dev / unauthenticated preview
        (socket as any).userId = (socket.handshake.query?.userId as string) || 'guest-user';
        (socket as any).userRole = 'BUYER';
        return next();
      }

      try {
        const payload: any = await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_SECRET || 'care-nest-jwt-secret-dev-2026',
        });
        (socket as any).userId = payload.sub || payload.id;
        (socket as any).userRole = payload.role || 'BUYER';
        next();
      } catch {
        // Dev fallback if token signature expired in dev environment
        (socket as any).userId = (socket.handshake.query?.userId as string) || 'guest-user';
        (socket as any).userRole = 'BUYER';
        next();
      }
    });

    this.io.on('connection', (socket: Socket) => {
      const userId = (socket as any).userId;
      if (userId) {
        socket.join(`user:${userId}`);
        this.logger.log(`[WS] Client connected: user:${userId} (socketId: ${socket.id})`);
        this.broadcastUserPresence(userId, true);
      }

      socket.on('join_conversation', ({ conversationId }: { conversationId: string }) => {
        if (!conversationId) return;
        socket.join(`conversation:${conversationId}`);
        this.logger.log(`[WS] user:${userId} joined conversation:${conversationId}`);
      });

      socket.on('leave_conversation', ({ conversationId }: { conversationId: string }) => {
        if (!conversationId) return;
        socket.leave(`conversation:${conversationId}`);
        this.logger.log(`[WS] user:${userId} left conversation:${conversationId}`);
      });

      socket.on('typing_start', ({ conversationId }: { conversationId: string }) => {
        if (!conversationId) return;
        socket.to(`conversation:${conversationId}`).emit('user_typing', {
          conversationId,
          userId,
          isTyping: true,
        });
      });

      socket.on('typing_stop', ({ conversationId }: { conversationId: string }) => {
        if (!conversationId) return;
        socket.to(`conversation:${conversationId}`).emit('user_typing', {
          conversationId,
          userId,
          isTyping: false,
        });
      });

      socket.on('send_message', async (data: SendMessageDto) => {
        try {
          const result = await this.chatService.saveAndBroadcastMessage(userId, data);
          // Acknowledge back to sender
          socket.emit('message_ack', {
            clientTempId: data.clientTempId,
            message: result,
          });
        } catch (err: any) {
          socket.emit('message_error', {
            clientTempId: data.clientTempId,
            error: err.message || 'Failed to send message',
          });
        }
      });

      socket.on('mark_as_read', async ({ conversationId, messageId }: { conversationId: string; messageId?: string }) => {
        try {
          await this.chatService.markConversationRead(userId, conversationId, messageId);
          this.io?.to(`conversation:${conversationId}`).emit('message_read_receipt', {
            conversationId,
            userId,
            readAt: new Date().toISOString(),
          });
        } catch (err) {
          this.logger.warn(`Failed to mark read: ${err}`);
        }
      });

      socket.on('disconnect', () => {
        this.logger.log(`[WS] Client disconnected: user:${userId}`);
        if (userId) {
          this.broadcastUserPresence(userId, false);
        }
      });
    });

    this.logger.log('🚀 Chat realtime gateway ready at /chat');
  }

  async onModuleDestroy() {
    try {
      this.io?.close();
    } catch {
      /* swallow */
    }
  }

  broadcastToConversation(conversationId: string, event: string, payload: unknown): void {
    if (!this.io) return;
    this.io.to(`conversation:${conversationId}`).emit(event, payload);
  }

  broadcastToUser(userId: string, event: string, payload: unknown): void {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit(event, payload);
  }

  broadcastUserPresence(userId: string, isOnline: boolean): void {
    if (!this.io) return;
    this.io.emit('user_presence', { userId, isOnline, timestamp: new Date().toISOString() });
  }
}

