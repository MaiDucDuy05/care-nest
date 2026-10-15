import { Injectable } from '@nestjs/common';
import { getPrismaClient, PrismaClient } from '@carenest/database';

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
