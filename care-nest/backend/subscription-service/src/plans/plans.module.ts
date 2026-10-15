import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PlansController } from './plans.controller.js';
import { PlansService } from './plans.service.js';
import { PlansRepository } from './plans.repository.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Module({
  imports: [JwtModule.register({})],
  controllers: [PlansController],
  providers: [PlansService, PlansRepository, JwtAuthGuard],
  exports: [PlansService, PlansRepository],
})
export class PlansModule {}
