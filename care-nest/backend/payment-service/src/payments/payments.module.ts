import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import { PaymentsRepository } from './payments.repository.js';
import { GatewaysModule } from '../gateways/gateways.module.js';
import { EscrowModule } from '../escrow/escrow.module.js';
import { KafkaModule } from '../kafka/kafka.module.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Module({
  imports: [GatewaysModule, EscrowModule, KafkaModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsRepository, JwtAuthGuard],
  exports: [PaymentsService, PaymentsRepository],
})
export class PaymentsModule {}
