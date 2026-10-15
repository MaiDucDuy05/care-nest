import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { getPrismaClient, PrismaClient } from '@carenest/database';
import type { CreateGeofenceDto, UpdateGeofenceDto } from './geofence.dto.js';

@Injectable()
export class GeofenceService {
  private readonly logger = new Logger(GeofenceService.name);
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  async create(userId: string, dto: CreateGeofenceDto): Promise<any> {
    return this.prisma.geofence.create({
      data: {
        userId,
        name: dto.name,
        centerLat: dto.centerLat,
        centerLon: dto.centerLon,
        radiusMeters: dto.radiusMeters,
      },
    });
  }

  async listForUser(userId: string): Promise<any> {
    return this.prisma.geofence.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, userId: string, dto: UpdateGeofenceDto): Promise<any> {
    const existing = await this.prisma.geofence.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      throw new NotFoundException(`Không tìm thấy geofence ${id}`);
    }
    return this.prisma.geofence.update({
      where: { id },
      data: {
        name: dto.name ?? undefined,
        centerLat: dto.centerLat ?? undefined,
        centerLon: dto.centerLon ?? undefined,
        radiusMeters: dto.radiusMeters ?? undefined,
        active: dto.active ?? undefined,
      },
    });
  }

  async softDelete(id: string, userId: string): Promise<any> {
    const existing = await this.prisma.geofence.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      throw new NotFoundException(`Không tìm thấy geofence ${id}`);
    }
    return this.prisma.geofence.update({
      where: { id },
      data: { deletedAt: new Date(), active: false },
    });
  }

  async listActiveForUser(userId: string): Promise<any[]> {
    return this.prisma.geofence.findMany({
      where: { userId, active: true, deletedAt: null },
    });
  }
}
