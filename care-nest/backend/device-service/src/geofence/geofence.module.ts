import { Module } from '@nestjs/common';
import { GeofenceService } from './geofence.service.js';
import { GeofenceController } from './geofence.controller.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Module({
  controllers: [GeofenceController],
  providers: [GeofenceService, JwtAuthGuard],
  exports: [GeofenceService],
})
export class GeofenceModule {}
