import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MetricsModule, HealthModule, RequestMetricsMiddleware } from '@carenest/nestjs-common';
import { DevicesModule } from './devices/devices.module.js';
import { AssignmentsModule } from './assignments/assignments.module.js';
import { TelemetryModule } from './telemetry/telemetry.module.js';
import { GeofenceModule } from './geofence/geofence.module.js';
import { CaregiversModule } from './caregivers/caregivers.module.js';
import { ActivationModule } from './activation/activation.module.js';

@Module({
  imports: [
    MetricsModule,
    HealthModule,
    DevicesModule,
    AssignmentsModule,
    TelemetryModule,
    GeofenceModule,
    CaregiversModule,
    ActivationModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestMetricsMiddleware).forRoutes('*');
  }
}
