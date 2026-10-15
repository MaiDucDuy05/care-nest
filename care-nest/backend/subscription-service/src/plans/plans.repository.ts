import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { getPrismaClient, PrismaClient, type Prisma } from '@carenest/database';
import type { CreatePlanDto, UpdatePlanDto } from './dto/plans.dto.js';

@Injectable()
export class PlansRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  async findAll(activeOnly = false): Promise<any[]> {
    return this.prisma.plan.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: { priceMonthly: 'asc' },
    });
  }

  async findById(id: string): Promise<any> {
    return this.prisma.plan.findUnique({ where: { id } });
  }

  async findByCode(code: string): Promise<any> {
    return this.prisma.plan.findUnique({ where: { code } });
  }

  async create(data: CreatePlanDto): Promise<any> {
    try {
      return await this.prisma.plan.create({
        data: {
          code: data.code,
          name: data.name,
          description: data.description,
          priceMonthly: data.priceMonthly,
          deviceLimit: data.deviceLimit ?? 1,
          caregiverLimit: data.caregiverLimit ?? 1,
          retentionMonths: data.retentionMonths ?? 6,
          features: data.features as Prisma.InputJsonValue,
        },
      });
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw new ConflictException(`Plan code "${data.code}" đã tồn tại`);
      }
      throw err;
    }
  }

  async update(id: string, data: UpdatePlanDto): Promise<any> {
    try {
      return await this.prisma.plan.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          priceMonthly: data.priceMonthly,
          deviceLimit: data.deviceLimit,
          caregiverLimit: data.caregiverLimit,
          retentionMonths: data.retentionMonths,
          features: data.features as Prisma.InputJsonValue,
        },
      });
    } catch (err: any) {
      if (err.code === 'P2025') {
        throw new NotFoundException(`Không tìm thấy plan ${id}`);
      }
      throw err;
    }
  }

  async setActive(id: string, active: boolean): Promise<any> {
    try {
      return await this.prisma.plan.update({ where: { id }, data: { active } });
    } catch (err: any) {
      if (err.code === 'P2025') throw new NotFoundException(`Không tìm thấy plan ${id}`);
      throw err;
    }
  }
}
