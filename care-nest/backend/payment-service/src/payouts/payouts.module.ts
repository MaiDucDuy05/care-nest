import { Module } from '@nestjs/common';
import { PayoutsController } from './payouts.controller.js';
import { PayoutsService } from './payouts.service.js';
import { PayoutsRepository } from './payouts.repository.js';
import { PayoutEventPublisher } from './payout-event.publisher.js';
import { EscrowReleaseWorker } from './escrow-release.worker.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Module({
  controllers: [PayoutsController],
  providers: [PayoutsService, PayoutsRepository, PayoutEventPublisher, EscrowReleaseWorker, JwtAuthGuard],
  exports: [PayoutsService, PayoutsRepository],
})
export class PayoutsModule {}
