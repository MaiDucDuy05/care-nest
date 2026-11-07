import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { getPrismaClient, type PrismaClient } from '@carenest/database';
import { ChatGateway } from './chat.gateway.js';
import type { CreateConversationDto, SendMessageDto } from './dto/chat.dto.js';

@Injectable()
export class ChatService {
  private prisma: PrismaClient;

  constructor(
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {
    this.prisma = getPrismaClient();
  }

  async listConversations(userId: string): Promise<any[]> {
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

    const unreadCounts = await Promise.all(
      participations.map((participation) =>
        this.prisma.chatMessage.count({
          where: {
            conversationId: participation.conversationId,
            senderId: { not: userId },
            isDeleted: false,
            createdAt: { gt: participation.lastReadAt },
          },
        }),
      ),
    );

    // For the seller side of a conversation, surface the buyer's real purchase
    // history with this seller (replaces the previously hardcoded 0/0 stats).
    const buyerStats = await Promise.all(
      participations.map(async (participation) => {
        const conversation = participation.conversation;
        const otherParticipant = conversation.participants.find(
          (item) => item.userId !== userId,
        );
        if (!otherParticipant || otherParticipant.role !== 'BUYER' || !conversation.sellerId) {
          return null;
        }

        const aggregate = await this.prisma.order.aggregate({
          where: {
            buyerId: otherParticipant.userId,
            sellerId: conversation.sellerId,
            status: { not: 'CANCELLED' },
            deletedAt: null,
          },
          _count: { _all: true },
          _sum: { total: true },
        });

        return {
          totalOrders: aggregate._count._all,
          totalSpent: Number(aggregate._sum.total || 0),
        };
      }),
    );

    return participations.map((participation, index) => {
      const conversation = participation.conversation;
      const lastMessage = conversation.messages[0] || null;
      const otherParticipant = conversation.participants.find(
        (item) => item.userId !== userId,
      )?.user || null;

      return {
        id: conversation.id,
        type: conversation.type,
        title:
          conversation.title ||
          conversation.seller?.storeName ||
          otherParticipant?.fullName ||
          'Hội thoại',
        sellerId: conversation.sellerId,
        seller: conversation.seller,
        metadata: conversation.metadata,
        lastMessageAt: conversation.lastMessageAt,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              type: lastMessage.type,
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt,
            }
          : null,
        unreadCount: unreadCounts[index],
        totalOrders: buyerStats[index]?.totalOrders ?? 0,
        totalSpent: buyerStats[index]?.totalSpent ?? 0,
        otherParticipant,
        myRole: participation.role,
      };
    });
  }

  async getOrCreateConversation(userId: string, dto: CreateConversationDto): Promise<any> {
    if (dto.sellerId) {
      const existing = await this.prisma.conversation.findFirst({
        where: {
          type: dto.type,
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

      if (existing) return existing;

      const seller = await this.prisma.seller.findUnique({
        where: { id: dto.sellerId },
        include: { user: true },
      });
      if (!seller) {
        throw new NotFoundException(`Seller ${dto.sellerId} not found`);
      }

      const created = await this.prisma.conversation.create({
        data: {
          type: dto.type,
          title: dto.title || seller.storeName || 'Tư vấn CareNest Mall',
          sellerId: seller.id,
          metadata: dto.metadata || {},
          participants: {
            create: [
              { userId, role: 'BUYER' },
              { userId: seller.userId, role: 'SELLER' },
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
          type: dto.metadata?.productId ? 'PRODUCT_SNIPPET' : 'TEXT',
          metadata: dto.metadata,
        });
      }

      return created;
    }

    return this.prisma.conversation.create({
      data: {
        type: dto.type,
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
  }

  async getMessages(
    userId: string,
    conversationId: string,
    cursor?: string,
    limit: number = 30,
  ): Promise<any[]> {
    await this.assertParticipant(userId, conversationId);
    const messages = await this.prisma.chatMessage.findMany({
      where: { conversationId, isDeleted: false },
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

    return messages.reverse();
  }

  async assertParticipant(userId: string, conversationId: string): Promise<void> {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      select: { id: true },
    });
    if (!participant) {
      throw new ForbiddenException('Bạn không thuộc hội thoại này');
    }
  }

  async saveAndBroadcastMessage(senderId: string, data: SendMessageDto): Promise<any> {
    await this.assertParticipant(senderId, data.conversationId);

    const savedMessage = await this.prisma.$transaction(async (tx) => {
      const message = await tx.chatMessage.create({
        data: {
          conversationId: data.conversationId,
          senderId,
          content: data.content,
          type: data.type,
          metadata: data.metadata || {},
          status: 'SENT',
        },
        include: {
          sender: {
            select: { id: true, fullName: true, role: true },
          },
        },
      });

      await tx.conversation.update({
        where: { id: data.conversationId },
        data: { lastMessageAt: new Date() },
      });

      return message;
    });

    this.chatGateway.broadcastToConversation(data.conversationId, 'message_received', {
      ...savedMessage,
      clientTempId: data.clientTempId,
    });

    return savedMessage;
  }

  async markConversationRead(userId: string, conversationId: string, _messageId?: string) {
    await this.assertParticipant(userId, conversationId);
    await this.prisma.$transaction([
      this.prisma.conversationParticipant.updateMany({
        where: { userId, conversationId },
        data: { lastReadAt: new Date() },
      }),
      this.prisma.chatMessage.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          status: { in: ['SENT', 'DELIVERED'] },
        },
        data: { status: 'READ' },
      }),
    ]);
  }
}
