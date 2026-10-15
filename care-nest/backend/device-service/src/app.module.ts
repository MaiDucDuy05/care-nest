import { Module } from '@nestjs/common';
import { DevicesModule } from './devices/devices.module.js';
import { AssignmentsModule } from './assignments/assignments.module.js';
import { TelemetryModule } from './telemetry/telemetry.module.js';
import { GeofenceModule } from './geofence/geofence.module.js';

@Module({
  imports: [DevicesModule, AssignmentsModule, TelemetryModule, GeofenceModule],
})
export class AppModule {}
