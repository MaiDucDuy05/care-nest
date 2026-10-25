import { Module } from '@nestjs/common';
import { KycService } from './kyc.service.js';
import { KycController, SellerKycController } from './kyc.controller.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Module({
  controllers: [KycController, SellerKycController],
  providers: [KycService, JwtAuthGuard],
  exports: [KycService],
})
export class KycModule {}
