import { Module } from '@nestjs/common';
import { AlertsController } from './alerts.controller.js';
import { AlertsService } from './alerts.service.js';
import { AlertsRepository } from './alerts.repository.js';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { KafkaModule } from '../kafka/kafka.module.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Module({
  imports: [RealtimeModule, KafkaModule],
  controllers: [AlertsController],
  providers: [AlertsService, AlertsRepository, JwtAuthGuard],
  exports: [AlertsService, AlertsRepository],
})
export class AlertsModule {}
