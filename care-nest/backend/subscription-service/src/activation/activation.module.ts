import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ActivationController } from './activation.controller.js';
import { ActivationService } from './activation.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Module({
  imports: [JwtModule.register({})],
  controllers: [ActivationController],
  providers: [ActivationService, JwtAuthGuard],
  exports: [ActivationService],
})
export class ActivationModule {}
