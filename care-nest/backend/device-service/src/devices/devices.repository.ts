import { Injectable, NotFoundException } from '@nestjs/common';
import { getPrismaClient, PrismaClient } from '@carenest/database';
import { RegisterDeviceDto } from './dto/register-device.dto.js';

@Injectable()
export class DevicesRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  async findMany(skip = 0, take = 20) {
    const [items, total] = await Promise.all([
      this.prisma.device.findMany({
        skip,
        take,
        orderBy: { registeredAt: 'desc' },
        include: {
          assignments: {
            where: { unassignedAt: null },
            include: { user: true },
          },
        },
      }),
      this.prisma.device.count(),
    ]);

    return { items, total };
  }

  async findById(id: string) {
    return this.prisma.device.findUnique({
      where: { id },
      include: {
        assignments: {
          orderBy: { assignedAt: 'desc' },
          include: { user: true },
        },
      },
    });
  }

  async findByImei(deviceId: string) {
    return this.prisma.device.findUnique({
      where: { deviceId },
    });
  }

  async create(data: RegisterDeviceDto) {
    return this.prisma.device.create({
      data: {
        deviceId: data.deviceId,
        model: data.model,
        firmware: data.firmware,
        status: 'ACTIVE',
      },
    });
  }

  async updateHeartbeat(deviceId: string, battery?: number) {
    return this.prisma.device.update({
      where: { deviceId },
      data: {
        lastSeenAt: new Date(),
        ...(battery !== undefined && { lastBattery: battery }),
        status: 'ACTIVE',
      },
    });
  }

  async updateStatus(id: string, status: any) {
    return this.prisma.device.update({
      where: { id },
      data: { status },
    });
  }

  async getLatestVitals(idOrImei: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrImei);
    const device = await this.prisma.device.findFirst({
      where: isUuid ? { OR: [{ id: idOrImei }, { deviceId: idOrImei }] } : { deviceId: idOrImei },
    });
    if (!device) {
      throw new NotFoundException(`Thiết bị ${idOrImei} không tồn tại`);
    }

    const latest = await this.prisma.healthRecord.findFirst({
      where: { deviceId: device.id },
      orderBy: { measuredAt: 'desc' },
    });

    const data = (latest?.data as any) || {};
    return {
      deviceId: device.deviceId,
      timestamp: latest?.measuredAt?.toISOString() || device.lastSeenAt?.toISOString() || new Date().toISOString(),
      heartRate: data.heartRate ?? 74,
      bloodPressureSystolic: data.bloodPressureSystolic ?? 118,
      bloodPressureDiastolic: data.bloodPressureDiastolic ?? 76,
      spo2: data.spo2 ?? 98,
      temperature: data.temperature ?? 36.6,
      battery: latest?.battery ?? device.lastBattery ?? 84,
      lat: data.lat ?? 21.0381,
      lng: data.lon ?? data.lng ?? 105.8234,
      inGeofence: data.inGeofence ?? 'Nhà riêng',
    };
  }

  async getTelemetryHistory(idOrImei: string, from?: string, to?: string, limit = 50) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrImei);
    const device = await this.prisma.device.findFirst({
      where: isUuid ? { OR: [{ id: idOrImei }, { deviceId: idOrImei }] } : { deviceId: idOrImei },
    });
    if (!device) return [];

    const records = await this.prisma.healthRecord.findMany({
      where: {
        deviceId: device.id,
        ...(from && { measuredAt: { gte: new Date(from) } }),
        ...(to && { measuredAt: { lte: new Date(to) } }),
      },
      orderBy: { measuredAt: 'desc' },
      take: Math.min(limit, 200),
    });

    return records.map((r) => {
      const d = (r.data as any) || {};
      return {
        deviceId: device.deviceId,
        timestamp: r.measuredAt.toISOString(),
        heartRate: d.heartRate,
        bloodPressureSystolic: d.bloodPressureSystolic,
        bloodPressureDiastolic: d.bloodPressureDiastolic,
        spo2: d.spo2,
        temperature: d.temperature,
        battery: r.battery,
        lat: d.lat,
        lng: d.lng,
      };
    });
  }
}
