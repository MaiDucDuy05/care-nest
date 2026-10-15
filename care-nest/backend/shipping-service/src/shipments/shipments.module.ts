import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ShipmentsController } from './shipments.controller.js';
import { ShipmentsService } from './shipments.service.js';
import { ShipmentsRepository } from './shipments.repository.js';
import { ProvidersModule } from '../providers/providers.module.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Module({
  imports: [JwtModule.register({}), ProvidersModule],
  controllers: [ShipmentsController],
  providers: [ShipmentsService, ShipmentsRepository, JwtAuthGuard],
  exports: [ShipmentsService, ShipmentsRepository],
})
export class ShipmentsModule {}
