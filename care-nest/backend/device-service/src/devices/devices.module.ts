import { Module } from '@nestjs/common';
import { DevicesController } from './devices.controller.js';
import { DevicesService } from './devices.service.js';
import { DevicesRepository } from './devices.repository.js';
import { ActivationModule } from '../activation/activation.module.js';
import { AssignmentsModule } from '../assignments/assignments.module.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Module({
  imports: [ActivationModule, AssignmentsModule],
  controllers: [DevicesController],
  providers: [DevicesService, DevicesRepository, JwtAuthGuard],
  exports: [DevicesService, DevicesRepository],
})
export class DevicesModule {}
