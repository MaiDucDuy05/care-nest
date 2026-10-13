import { Injectable } from '@nestjs/common';
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
}
