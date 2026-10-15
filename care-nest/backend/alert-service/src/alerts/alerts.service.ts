import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AlertStatus, AlertSeverity, AlertType } from '@carenest/database';
import { AlertsRepository } from './alerts.repository.js';
import { RealtimeGateway } from '../realtime/realtime.gateway.js';
import { OrderEventPublisher } from '../kafka/order-event.publisher.js';
import { evaluateVitals, isOutsideGeofence, type VitalsReading } from '../rules/vitals-rules.js';
import type { UpdateAlertStatusDto } from './dto/alert.dto.js';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    private readonly alertsRepository: AlertsRepository,
    private readonly realtime: RealtimeGateway,
    private readonly eventPublisher: OrderEventPublisher,
  ) {}

  /**
   * Process a vitals reading — check thresholds and create an alert if
   * triggered. Pushes to WebSocket subscribers in real-time (<5s).
   */
  async handleVitals(payload: { deviceId: string; subjectId: string; reading: VitalsReading }): Promise<any> {
    const result = evaluateVitals(payload.reading);
    if (!result.triggered) return null;

    const alert = await this.alertsRepository.create({
      deviceId: payload.deviceId,
      subjectId: payload.subjectId,
      type: result.type!,
      severity: result.severity!,
      occurredAt: payload.reading.measuredAt,
      payload: { metric: result.metric, value: result.value, reason: result.reason },
    });

    // Real-time push
    try {
      this.realtime.broadcastToSubject(payload.subjectId, 'alert', alert);
    } catch (err: any) {
      this.logger.warn({ err: err.message }, 'Realtime broadcast failed');
    }

    // Publish to ALERT_TRIGGERED for downstream consumers (notification-service)
    try {
      await this.eventPublisher.publishAlertTriggered({
        alertId: alert.id,
        subjectId: alert.subjectId,
        deviceId: alert.deviceId,
        type: alert.type,
        severity: alert.severity,
        payload: { metric: result.metric, value: result.value, reason: result.reason },
      });
    } catch (err: any) {
      this.logger.warn({ err: err.message }, 'ALERT_TRIGGERED publish failed');
    }

    return alert;
  }

  async handleSos(payload: { deviceId: string; subjectId: string; occurredAt: Date; lat?: number; lon?: number }): Promise<any> {
    const alert = await this.alertsRepository.create({
      deviceId: payload.deviceId,
      subjectId: payload.subjectId,
      type: AlertType.SOS,
      severity: AlertSeverity.CRITICAL,
      occurredAt: payload.occurredAt,
      payload: { lat: payload.lat, lon: payload.lon },
    });

    try { this.realtime.broadcastToSubject(payload.subjectId, 'alert', alert); } catch { /* swallow */ }
    try {
      await this.eventPublisher.publishAlertTriggered({
        alertId: alert.id, subjectId: alert.subjectId, deviceId: alert.deviceId,
        type: alert.type, severity: alert.severity, payload: { lat: payload.lat, lon: payload.lon },
      });
    } catch { /* swallow */ }
    return alert;
  }

  async handleFall(payload: { deviceId: string; subjectId: string; occurredAt: Date; lat?: number; lon?: number }): Promise<any> {
    const alert = await this.alertsRepository.create({
      deviceId: payload.deviceId,
      subjectId: payload.subjectId,
      type: AlertType.FALL,
      severity: AlertSeverity.HIGH,
      occurredAt: payload.occurredAt,
      payload: { lat: payload.lat, lon: payload.lon },
    });
    try { this.realtime.broadcastToSubject(payload.subjectId, 'alert', alert); } catch { /* swallow */ }
    try {
      await this.eventPublisher.publishAlertTriggered({
        alertId: alert.id, subjectId: alert.subjectId, deviceId: alert.deviceId,
        type: alert.type, severity: alert.severity, payload: { lat: payload.lat, lon: payload.lon },
      });
    } catch { /* swallow */ }
    return alert;
  }

  async handleGeofence(payload: { deviceId: string; subjectId: string; occurredAt: Date; currentLat: number; currentLon: number; centerLat: number; centerLon: number; radiusMeters: number }): Promise<any> {
    if (!isOutsideGeofence({ lat: payload.currentLat, lon: payload.currentLon }, { lat: payload.centerLat, lon: payload.centerLon }, payload.radiusMeters)) {
      return null;
    }
    const alert = await this.alertsRepository.create({
      deviceId: payload.deviceId,
      subjectId: payload.subjectId,
      type: AlertType.GEOFENCE_EXIT,
      severity: AlertSeverity.MEDIUM,
      occurredAt: payload.occurredAt,
      payload: { currentLat: payload.currentLat, currentLon: payload.currentLon, centerLat: payload.centerLat, centerLon: payload.centerLon, radiusMeters: payload.radiusMeters },
    });
    try { this.realtime.broadcastToSubject(payload.subjectId, 'alert', alert); } catch { /* swallow */ }
    try {
      await this.eventPublisher.publishAlertTriggered({
        alertId: alert.id, subjectId: alert.subjectId, deviceId: alert.deviceId,
        type: alert.type, severity: alert.severity, payload: { reason: 'Ra khỏi vùng an toàn' },
      });
    } catch { /* swallow */ }
    return alert;
  }

  async handleLowBattery(payload: { deviceId: string; subjectId: string; occurredAt: Date; battery: number }): Promise<any> {
    if (payload.battery > 20) return null;
    const alert = await this.alertsRepository.create({
      deviceId: payload.deviceId,
      subjectId: payload.subjectId,
      type: AlertType.LOW_BATTERY,
      severity: payload.battery < 10 ? AlertSeverity.HIGH : AlertSeverity.LOW,
      occurredAt: payload.occurredAt,
      payload: { battery: payload.battery },
    });
    try { this.realtime.broadcastToSubject(payload.subjectId, 'alert', alert); } catch { /* swallow */ }
    return alert;
  }

  async listOpen(page = 1, pageSize = 50): Promise<any> {
    return this.alertsRepository.listOpen(page, pageSize);
  }

  async listForSubject(subjectId: string, page = 1, pageSize = 20): Promise<any> {
    return this.alertsRepository.listForSubject(subjectId, page, pageSize);
  }

  async updateStatus(id: string, dto: UpdateAlertStatusDto): Promise<any> {
    const alert = await this.alertsRepository.findById(id);
    if (!alert) throw new NotFoundException(`Không tìm thấy alert ${id}`);
    return this.alertsRepository.updateStatus(id, dto.status as AlertStatus, dto.notes);
  }
}
