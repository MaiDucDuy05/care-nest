import { Injectable } from '@nestjs/common';
import { getPrismaClient, PrismaClient, type Prisma, UserRole, UserStatus } from '@carenest/database';

@Injectable()
export class UsersRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async listForAdmin(args: { where: Prisma.UserWhereInput; skip: number; take: number }) {
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: args.where,
        orderBy: { createdAt: 'desc' },
        skip: args.skip,
        take: args.take,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
        },
      }),
      this.prisma.user.count({ where: args.where }),
    ]);

    const orderStats = users.length
      ? await this.prisma.order.groupBy({
          by: ['buyerId'],
          where: { buyerId: { in: users.map((user) => user.id) }, deletedAt: null },
          _count: { buyerId: true },
          _sum: { total: true },
        })
      : [];
    const statsByBuyerId = new Map(
      orderStats.map((stats) => [
        stats.buyerId,
        { totalOrders: stats._count.buyerId, totalSpentVnd: Number(stats._sum.total ?? 0) },
      ]),
    );

    return {
      data: users.map((user) => ({
        ...user,
        ...statsByBuyerId.get(user.id),
        totalOrders: statsByBuyerId.get(user.id)?.totalOrders ?? 0,
        totalSpentVnd: statsByBuyerId.get(user.id)?.totalSpentVnd ?? 0,
      })),
      total,
    };
  }

  async findAdminDetail(id: string) {
    const [user, orderStats] = await Promise.all([
      this.prisma.user.findFirst({
        where: { id, deletedAt: null },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
          orders: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { id: true, total: true, status: true, createdAt: true },
          },
        },
      }),
      this.prisma.order.aggregate({
        where: { buyerId: id, deletedAt: null },
        _count: { _all: true },
        _sum: { total: true },
      }),
    ]);

    if (!user) return null;

    return {
      ...user,
      totalOrders: orderStats._count._all,
      totalSpentVnd: Number(orderStats._sum.total ?? 0),
      orders: user.orders.map((order) => ({ ...order, totalVnd: Number(order.total) })),
    };
  }

  async updateStatus(id: string, status: UserStatus) {
    return this.prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, fullName: true, email: true, role: true, status: true },
    });
  }

  async updateRole(id: string, role: UserRole) {
    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, fullName: true, email: true, role: true, status: true },
    });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    phone?: string;
    fullName: string;
    role: any;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        phone: data.phone,
        fullName: data.fullName,
        role: data.role,
      },
    });
  }

  async updateLastLogin(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async setMfaSecret(id: string, secret: string) {
    return this.prisma.user.update({
      where: { id },
      data: { mfaSecret: secret },
    });
  }

  async enableMfa(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { mfaEnabled: true },
    });
  }

  async disableMfa(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { mfaEnabled: false, mfaSecret: null },
    });
  }
}
