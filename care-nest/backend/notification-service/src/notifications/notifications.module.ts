import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import { NotificationsRepository } from './notifications.repository.js';
import { ChannelsModule } from '../channels/channels.module.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Module({
  imports: [ChannelsModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsRepository, JwtAuthGuard],
  exports: [NotificationsService, NotificationsRepository],
})
export class NotificationsModule {}
