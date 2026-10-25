import { Controller, Get, Post, Param, Query, Body, BadRequestException, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { CreateNotificationSchema } from './dto/notification.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(
    @CurrentUser() user: { id: string },
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ): Promise<any> {
    return this.notificationsService.listForUser(user.id, parseInt(page, 10) || 1, parseInt(pageSize, 10) || 20);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser() user: { id: string; role?: string }, @Body() body: unknown) {
    const parsed = CreateNotificationSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    // Non-admin users can only send to themselves
    if (user.role !== 'ADMIN' && parsed.data.userId !== user.id) {
      throw new BadRequestException('Chỉ admin mới có thể gửi notification cho user khác');
    }
    return this.notificationsService.send(parsed.data);
  }

  @Post(':id/read')
  @UseGuards(JwtAuthGuard)
  async read(@Param('id') id: string): Promise<any> {
    return this.notificationsService.markRead(id);
  }
}
