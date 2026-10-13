import { Module } from '@nestjs/common';
import { TelemetryService } from './telemetry.service.js';
import { TelemetryConsumer } from './telemetry.consumer.js';
import { DevicesModule } from '../devices/devices.module.js';

@Module({
  imports: [DevicesModule],
  providers: [TelemetryService, TelemetryConsumer],
  exports: [TelemetryService],
})
export class TelemetryModule {}
