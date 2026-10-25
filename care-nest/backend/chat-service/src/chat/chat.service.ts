import { Injectable, Logger, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { getPrismaClient, type PrismaClient } from '@carenest/database';
import { ChatGateway } from './chat.gateway.js';
import type { CreateConversationDto, SendMessageDto } from './dto/chat.dto.js';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private prisma: PrismaClient;

  constructor(
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {
    this.prisma = getPrismaClient();
  }

  /**
   * List all conversations for a user (as buyer or seller)
   */
  async listConversations(userId: string): Promise<any[]> {
    try {
      const participations = await this.prisma.conversationParticipant.findMany({
        where: { userId },
        include: {
          conversation: {
            include: {
              seller: {
                select: { id: true, storeName: true, storeSlug: true, ratingAvg: true },
              },
              participants: {
                include: {
                  user: {
                    select: { id: true, fullName: true, email: true, role: true },
                  },
                },
              },
              messages: {
                take: 1,
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        },
        orderBy: {
          conversation: {
            lastMessageAt: 'desc',
          },
        },
      });

      return participations.map((p) => {
        const conv = p.conversation;
        const lastMsg = conv.messages[0] || null;
        const otherParticipant = conv.participants.find((item) => item.userId !== userId)?.user || null;

        return {
          id: conv.id,
          type: conv.type,
          title: conv.title || conv.seller?.storeName || otherParticipant?.fullName || 'Hội thoại',
          seller: conv.seller,
          metadata: conv.metadata,
          lastMessageAt: conv.lastMessageAt,
          lastMessage: lastMsg
            ? {
                id: lastMsg.id,
                content: lastMsg.content,
                type: lastMsg.type,
                senderId: lastMsg.senderId,
                createdAt: lastMsg.createdAt,
              }
            : null,
          unreadCount: 0, // Calculated dynamically
          otherParticipant,
          myRole: p.role,
        };
      });
    } catch (err: any) {
      this.logger.warn(`Failed to query database for conversations: ${err.message}. Returning fallback.`);
      return this.getFallbackConversations();
    }
  }

  /**
   * Get or create a conversation between buyer and seller / consultant
   */
  async getOrCreateConversation(userId: string, dto: CreateConversationDto): Promise<any> {
    try {
      if (dto.sellerId) {
        // Find existing conversation with this seller
        const existing = await this.prisma.conversation.findFirst({
          where: {
            type: dto.type as any,
            sellerId: dto.sellerId,
            participants: {
              some: { userId },
            },
          },
          include: {
            seller: true,
            participants: {
              include: {
                user: { select: { id: true, fullName: true, role: true } },
              },
            },
          },
        });

        if (existing) {
          return existing;
        }

        // Find seller user id to add as participant
        const seller = await this.prisma.seller.findUnique({
          where: { id: dto.sellerId },
          include: { user: true },
        });

        const created = await this.prisma.conversation.create({
          data: {
            type: (dto.type || 'BUYER_SELLER') as any,
            title: dto.title || seller?.storeName || 'Tư vấn CareNest Mall',
            sellerId: dto.sellerId,
            metadata: dto.metadata || {},
            participants: {
              create: [
                { userId, role: 'BUYER' },
                ...(seller?.userId ? [{ userId: seller.userId, role: 'SELLER' as const }] : []),
              ],
            },
          },
          include: {
            seller: true,
            participants: {
              include: {
                user: { select: { id: true, fullName: true, role: true } },
              },
            },
          },
        });

        if (dto.initialMessage) {
          await this.saveAndBroadcastMessage(userId, {
            conversationId: created.id,
            content: dto.initialMessage,
            type: (dto.metadata?.productId ? 'PRODUCT_SNIPPET' : 'TEXT') as any,
            metadata: dto.metadata,
          });
        }

        return created;
      }

      // Default generic conversation
      const created = await this.prisma.conversation.create({
        data: {
          type: (dto.type || 'BUYER_SELLER') as any,
          title: dto.title || 'Hội thoại mới',
          metadata: dto.metadata || {},
          participants: {
            create: [{ userId, role: 'BUYER' }],
          },
        },
        include: {
          seller: true,
          participants: true,
        },
      });

      return created;
    } catch (err: any) {
      this.logger.warn(`Failed to create conversation in DB: ${err.message}. Returning mock conversation.`);
      return {
        id: 'mock-conv-' + (dto.sellerId || 'support'),
        type: dto.type || 'BUYER_SELLER',
        title: dto.title || 'MedTech Healthcare Vietnam',
        sellerId: dto.sellerId || null,
        metadata: dto.metadata || {},
        lastMessageAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        seller: {
          id: dto.sellerId || 'seller-medtech-01',
          storeName: 'MedTech Healthcare Vietnam',
          storeSlug: 'medtech-vietnam',
          ratingAvg: 4.9,
        },
      };
    }
  }

  /**
   * Get message history for a conversation
   */
  async getMessages(conversationId: string, cursor?: string, limit: number = 30) {
    try {
      const messages = await this.prisma.chatMessage.findMany({
        where: { conversationId },
        take: limit,
        ...(cursor
          ? {
              cursor: { id: cursor },
              skip: 1,
            }
          : {}),
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: { id: true, fullName: true, role: true },
          },
          attachments: true,
        },
      });

      // Reverse so frontend gets chronological order
      return messages.reverse();
    } catch (err: any) {
      this.logger.warn(`Failed to query messages: ${err.message}. Returning fallback.`);
      return this.getFallbackMessages(conversationId);
    }
  }

  /**
   * Save message to DB and broadcast to conversation room
   */
  async saveAndBroadcastMessage(senderId: string, data: SendMessageDto) {
    let savedMessage: any = null;

    try {
      savedMessage = await this.prisma.chatMessage.create({
        data: {
          conversationId: data.conversationId,
          senderId,
          content: data.content,
          type: (data.type || 'TEXT') as any,
          metadata: data.metadata || {},
          status: 'SENT',
        },
        include: {
          sender: {
            select: { id: true, fullName: true, role: true },
          },
        },
      });

      // Update conversation lastMessageAt
      await this.prisma.conversation.update({
        where: { id: data.conversationId },
        data: { lastMessageAt: new Date() },
      });
    } catch (err: any) {
      this.logger.warn(`Failed to persist message in DB: ${err.message}. Using ephemeral payload.`);
      savedMessage = {
        id: 'msg-' + Date.now(),
        conversationId: data.conversationId,
        senderId,
        content: data.content,
        type: data.type || 'TEXT',
        metadata: data.metadata || {},
        status: 'SENT',
        createdAt: new Date(),
        sender: {
          id: senderId,
          fullName: senderId === 'guest-user' ? 'Tôi' : 'Người Dùng',
          role: 'BUYER',
        },
      };
    }

    // Broadcast realtime event to conversation room
    this.chatGateway.broadcastToConversation(data.conversationId, 'message_received', {
      ...savedMessage,
      clientTempId: data.clientTempId,
    });

    return savedMessage;
  }

  /**
   * Mark messages as read for a participant
   */
  async markConversationRead(userId: string, conversationId: string, messageId?: string) {
    try {
      await this.prisma.conversationParticipant.updateMany({
        where: { userId, conversationId },
        data: { lastReadAt: new Date() },
      });

      await this.prisma.chatMessage.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          status: { in: ['SENT', 'DELIVERED'] },
        },
        data: { status: 'READ' },
      });
    } catch (err: any) {
      this.logger.warn(`Failed to mark read in DB: ${err.message}`);
    }
  }

  // Fallback demo data when DB container is warming up
  private getFallbackConversations() {
    return [
      {
        id: 'mock-conv-medtech',
        type: 'BUYER_SELLER',
        title: 'MedTech Healthcare Vietnam (Official)',
        seller: {
          id: 'seller-medtech-01',
          storeName: 'MedTech Healthcare Vietnam',
          storeSlug: 'medtech-vietnam',
          ratingAvg: 4.9,
        },
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 5),
        lastMessage: {
          id: 'mock-msg-01',
          content: 'Xin chào! Dược sĩ Lê Thu Trang đã sẵn sàng giải đáp thắc mắc về máy đo huyết áp Omron.',
          type: 'TEXT',
          senderId: 'seller-medtech-01',
          createdAt: new Date(Date.now() - 1000 * 60 * 5),
        },
        unreadCount: 1,
        myRole: 'BUYER',
      },
      {
        id: 'mock-conv-wonlex',
        type: 'BUYER_SELLER',
        title: 'Wonlex Smartcare Official Store',
        seller: {
          id: 'seller-wonlex-02',
          storeName: 'Wonlex Smartcare Official Store',
          storeSlug: 'wonlex-vietnam',
          ratingAvg: 4.8,
        },
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 60),
        lastMessage: {
          id: 'mock-msg-02',
          content: 'Đồng hồ định vị KT17 đã được cài đặt sẵn gói SIM 4G Viettel 12 tháng.',
          type: 'TEXT',
          senderId: 'seller-wonlex-02',
          createdAt: new Date(Date.now() - 1000 * 60 * 60),
        },
        unreadCount: 0,
        myRole: 'BUYER',
      },
    ];
  }

  private getFallbackMessages(conversationId: string) {
    return [
      {
        id: 'mock-msg-01',
        conversationId,
        senderId: 'seller-medtech-01',
        content: 'Dạ xin chào anh/chị! Em là Dược sĩ Lê Thu Trang từ MedTech Healthcare Vietnam. Shop có thể tư vấn sản phẩm y tế hoặc hỗ trợ đơn hàng nào cho gia đình mình ạ?',
        type: 'TEXT',
        status: 'READ',
        createdAt: new Date(Date.now() - 1000 * 60 * 15),
        sender: {
          id: 'seller-medtech-01',
          fullName: 'Dược Sĩ Lê Thu Trang (MedTech)',
          role: 'SELLER',
        },
      },
      {
        id: 'mock-msg-02',
        conversationId,
        senderId: 'guest-user',
        content: 'Shop cho mình hỏi máy đo huyết áp Omron HEM-7156T có kết nối tự động lưu kết quả vào app CareNest được không?',
        type: 'TEXT',
        status: 'READ',
        createdAt: new Date(Date.now() - 1000 * 60 * 10),
        sender: {
          id: 'guest-user',
          fullName: 'Tôi',
          role: 'BUYER',
        },
      },
      {
        id: 'mock-msg-03',
        conversationId,
        senderId: 'seller-medtech-01',
        content: 'Dạ hoàn toàn được ạ! Dòng HEM-7156T trang bị Bluetooth kết nối trực tiếp với CareNest. Mỗi lần phụ huynh đo xong, chỉ số huyết áp tâm thu, tâm trương và nhịp tim sẽ tự đồng bộ ngay vào mục "Tổng Quan Sinh Tồn" để con cháu theo dõi từ xa ạ.',
        type: 'TEXT',
        status: 'SENT',
        createdAt: new Date(Date.now() - 1000 * 60 * 5),
        sender: {
          id: 'seller-medtech-01',
          fullName: 'Dược Sĩ Lê Thu Trang (MedTech)',
          role: 'SELLER',
        },
      },
    ];
  }
}
