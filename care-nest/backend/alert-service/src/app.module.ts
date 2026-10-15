import { Module } from '@nestjs/common';
import { AlertsModule } from './alerts/alerts.module.js';
import { KafkaModule } from './kafka/kafka.module.js';
import { RealtimeModule } from './realtime/realtime.module.js';

@Module({
  imports: [AlertsModule, KafkaModule, RealtimeModule],
})
export class AppModule {}
