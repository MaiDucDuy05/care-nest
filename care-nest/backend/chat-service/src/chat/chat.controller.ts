
import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, type JwtUser } from '@carenest/nestjs-common';
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
  @UseGuards(JwtAuthGuard)
  async listConversations(@CurrentUser() user: JwtUser): Promise<any> {
    return this.chatService.listConversations(user.id);
  }

  @Post('conversations')
  @UseGuards(JwtAuthGuard)
  async getOrCreateConversation(
    @Body() body: CreateConversationDto,
    @CurrentUser() user: JwtUser,
  ): Promise<any> {
    const parsed = CreateConversationSchema.parse(body);
    return this.chatService.getOrCreateConversation(user.id, parsed);
  }

  @Get('conversations/:id/messages')
  @UseGuards(JwtAuthGuard)
  async getMessages(
    @Param('id') conversationId: string,
    @CurrentUser() user: JwtUser,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ): Promise<any[]> {
    const parsedLimit = limit ? parseInt(limit, 10) : 30;
    return this.chatService.getMessages(user.id, conversationId, cursor, parsedLimit);
  }

  @Post('conversations/:id/messages')
  @UseGuards(JwtAuthGuard)
  async sendMessage(
    @Param('id') conversationId: string,
    @CurrentUser() user: JwtUser,
    @Body() body: Omit<SendMessageDto, 'conversationId'>,
  ): Promise<any> {
    const parsed = SendMessageSchema.parse({ ...body, conversationId });
    return this.chatService.saveAndBroadcastMessage(user.id, parsed);
  }

  @Post('conversations/:id/read')
  @UseGuards(JwtAuthGuard)
  async markRead(
    @Param('id') conversationId: string,
    @CurrentUser() user: JwtUser,
    @Body() body: { messageId?: string },
  ) {
    await this.chatService.markConversationRead(user.id, conversationId, body.messageId);
    return { success: true };
  }
}
