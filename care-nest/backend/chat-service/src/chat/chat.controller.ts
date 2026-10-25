
import { Controller, Get, Post, Body, Param, Query, Req, UseGuards, Headers } from '@nestjs/common';
import { ChatService } from './chat.service.js';
import {
  CreateConversationSchema,
  SendMessageSchema,
  type CreateConversationDto,
  type SendMessageDto,
} from './dto/chat.dto.js';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'chat-service', timestamp: new Date().toISOString() };
  }

  @Get('conversations')
  async listConversations(@Headers('x-user-id') headerUserId?: string): Promise<any> {
    const userId = headerUserId || 'guest-user';
    return this.chatService.listConversations(userId);
  }

  @Post('conversations')
  async getOrCreateConversation(
    @Body() body: CreateConversationDto,
    @Headers('x-user-id') headerUserId?: string,
  ): Promise<any> {
    const userId = headerUserId || 'guest-user';
    const parsed = CreateConversationSchema.parse(body);
    return this.chatService.getOrCreateConversation(userId, parsed);
  }

  @Get('conversations/:id/messages')
  async getMessages(
    @Param('id') conversationId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 30;
    return this.chatService.getMessages(conversationId, cursor, parsedLimit);
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @Param('id') conversationId: string,
    @Body() body: Omit<SendMessageDto, 'conversationId'>,
    @Headers('x-user-id') headerUserId?: string,
  ) {
    const userId = headerUserId || 'guest-user';
    const parsed = SendMessageSchema.parse({ ...body, conversationId });
    return this.chatService.saveAndBroadcastMessage(userId, parsed);
  }

  @Post('conversations/:id/read')
  async markRead(
    @Param('id') conversationId: string,
    @Body() body: { messageId?: string },
    @Headers('x-user-id') headerUserId?: string,
  ) {
    const userId = headerUserId || 'guest-user';
    await this.chatService.markConversationRead(userId, conversationId, body.messageId);
    return { success: true };
  }
}
