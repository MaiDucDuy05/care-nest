import { Injectable, NotFoundException } from '@nestjs/common';
import { getPrismaClient, PrismaClient, type ShipmentStatus } from '@carenest/database';

@Injectable()
export class ShipmentsRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  async findById(id: string): Promise<any> {
    return this.prisma.shipment.findUnique({ where: { id } });
  }

  async findByOrderId(orderId: string): Promise<any> {
    return this.prisma.shipment.findUnique({ where: { orderId } });
  }

  async findByTrackingCode(trackingCode: string): Promise<any> {
    return this.prisma.shipment.findUnique({ where: { trackingCode } });
  }

  async listForSeller(sellerId: string, status?: ShipmentStatus): Promise<any[]> {
    return this.prisma.shipment.findMany({
      where: { sellerId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async create(data: {
    orderId: string;
    sellerId: string;
    carrier: string;
    trackingCode: string;
    shippingFee: number;
    weight: number;
    estimatedAt?: Date;
    metadata?: any;
  }): Promise<any> {
    return this.prisma.shipment.create({
      data: {
        orderId: data.orderId,
        sellerId: data.sellerId,
        carrier: data.carrier,
        trackingCode: data.trackingCode,
        status: 'PENDING_PICKUP',
        shippingFee: data.shippingFee,
        weight: data.weight,
        estimatedAt: data.estimatedAt,
        metadata: data.metadata,
      },
    });
  }

  async updateStatus(
    id: string,
    status: ShipmentStatus,
    extra?: { deliveredAt?: Date; pickedUpAt?: Date; failedReason?: string },
  ): Promise<any> {
    try {
      return await this.prisma.shipment.update({
        where: { id },
        data: {
          status,
          ...(extra?.deliveredAt ? { deliveredAt: extra.deliveredAt } : {}),
          ...(extra?.pickedUpAt ? { pickedUpAt: extra.pickedUpAt } : {}),
          ...(extra?.failedReason ? { failedReason: extra.failedReason } : {}),
        },
      });
    } catch (err: any) {
      if (err.code === 'P2025') throw new NotFoundException(`Không tìm thấy shipment ${id}`);
      throw err;
    }
  }
}
