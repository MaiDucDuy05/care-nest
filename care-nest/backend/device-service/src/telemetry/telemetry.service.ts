import { Injectable, Logger } from '@nestjs/common';
import { DevicesService } from '../devices/devices.service.js';

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  constructor(private readonly devicesService: DevicesService) {}

  async handleHeartbeat(payload: { deviceId: string; battery?: number; timestamp?: string }) {
    this.logger.debug(`[Telemetry] Heartbeat from device ${payload.deviceId}`);
    try {
      await this.devicesService.updateHeartbeat(payload.deviceId, payload.battery);
    } catch (err: any) {
      this.logger.warn(`Failed to update heartbeat for device ${payload.deviceId}: ${err.message}`);
    }
  }

  async handleTelemetryEvent(topic: string, data: any) {
    if (data?.deviceId) {
      await this.devicesService.updateHeartbeat(data.deviceId, data.battery);
    }
  }
}
