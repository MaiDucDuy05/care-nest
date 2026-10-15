import { Module } from '@nestjs/common';
import { CaregiversController } from './caregivers.controller.js';
import { CaregiversService } from './caregivers.service.js';
import { CaregiversRepository } from './caregivers.repository.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Module({
  controllers: [CaregiversController],
  providers: [CaregiversService, CaregiversRepository, JwtAuthGuard],
  exports: [CaregiversService],
})
export class CaregiversModule {}
