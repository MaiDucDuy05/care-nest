import { Module } from '@nestjs/common';
import { VnpayGateway } from './vnpay.gateway.js';
import { MomoGateway } from './momo.gateway.js';
import { CodGateway } from './cod.gateway.js';

@Module({
  providers: [VnpayGateway, MomoGateway, CodGateway],
  exports: [VnpayGateway, MomoGateway, CodGateway],
})
export class GatewaysModule {}
