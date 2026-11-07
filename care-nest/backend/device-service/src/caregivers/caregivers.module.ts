import { Module } from '@nestjs/common';
import { CaregiversController } from './caregivers.controller.js';
import { CaregiversService } from './caregivers.service.js';
import { CaregiversRepository } from './caregivers.repository.js';
import { CaregiverInviteNotificationPublisher } from './caregiver-invite-notification.publisher.js';
import { CareAccessService } from './care-access.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Module({
  controllers: [CaregiversController],
  providers: [CaregiversService, CaregiversRepository, CaregiverInviteNotificationPublisher, CareAccessService, JwtAuthGuard],
  exports: [CaregiversService, CareAccessService],
})
export class CaregiversModule {}
