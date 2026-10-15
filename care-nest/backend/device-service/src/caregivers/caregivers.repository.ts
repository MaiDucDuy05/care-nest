import { Injectable } from '@nestjs/common';
import { getPrismaClient, PrismaClient } from '@carenest/database';
import type { Caregiver } from '@carenest/database';

@Injectable()
export class CaregiversRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  /**
   * Create a caregiver link where the subject (userId) invites a caretaker by email.
   * Returns the created row.
   */
  async create(data: {
    userId: string;
    caretakerId: string;
    relationship: string;
    permissions: Record<string, boolean>;
  }): Promise<Caregiver> {
    return (await this.prisma.caregiver.create({
      data: {
        userId: data.userId,
        caretakerId: data.caretakerId,
        relationship: data.relationship,
        permissions: data.permissions,
      },
    })) as Caregiver;
  }

  /**
   * List all caregiver links for a user (subject) who has not been revoked.
   */
  async listForUser(userId: string): Promise<Caregiver[]> {
    return (await this.prisma.caregiver.findMany({
      where: { userId, revokedAt: null },
      orderBy: { invitedAt: 'desc' },
    })) as Caregiver[];
  }

  /**
   * List all caregiver links where the user is the caretaker.
   */
  async listForCaretaker(caretakerId: string): Promise<Caregiver[]> {
    return (await this.prisma.caregiver.findMany({
      where: { caretakerId, revokedAt: null },
      orderBy: { invitedAt: 'desc' },
    })) as Caregiver[];
  }

  /**
   * Revoke (soft-delete) a caregiver link. Only the owner (userId) can revoke.
   */
  async revoke(id: string, userId: string): Promise<Caregiver> {
    return (await this.prisma.caregiver.update({
      where: { id },
      data: { revokedAt: new Date() },
    })) as Caregiver;
  }
}
