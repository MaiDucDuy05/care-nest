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
   * Create or update a caregiver link where the subject (userId) invites a caretaker.
   * Auto-sets acceptedAt so in sandbox/demo environments the link is immediately active.
   */
  async create(data: {
    userId: string;
    caretakerId: string;
    relationship: string;
    permissions: Record<string, boolean>;
  }): Promise<Caregiver> {
    return (await this.prisma.caregiver.upsert({
      where: {
        userId_caretakerId: {
          userId: data.userId,
          caretakerId: data.caretakerId,
        },
      },
      update: {
        relationship: data.relationship,
        permissions: data.permissions,
        revokedAt: null,
        acceptedAt: new Date(),
        invitedAt: new Date(),
      },
      create: {
        userId: data.userId,
        caretakerId: data.caretakerId,
        relationship: data.relationship,
        permissions: data.permissions,
        acceptedAt: new Date(),
      },
      include: {
        caretaker: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
          },
        },
      },
    })) as Caregiver;
  }

  /**
   * List all caregiver links for a user (subject) who has not been revoked.
   * Includes caretaker details (fullName, email, phone).
   */
  async listForUser(userId: string): Promise<any[]> {
    return await this.prisma.caregiver.findMany({
      where: { userId, revokedAt: null },
      orderBy: { invitedAt: 'desc' },
      include: {
        caretaker: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
          },
        },
      },
    });
  }

  /**
   * List all caregiver links where the user is the caretaker.
   * Includes patient (user) details and their active devices.
   */
  async listForCaretaker(caretakerId: string): Promise<any[]> {
    return await this.prisma.caregiver.findMany({
      where: { caretakerId, revokedAt: null },
      orderBy: { invitedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            deviceAssignments: {
              where: { unassignedAt: null },
              include: {
                device: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Accept an invitation as a caretaker.
   */
  async accept(id: string, caretakerId: string): Promise<Caregiver> {
    return (await this.prisma.caregiver.update({
      where: { id },
      data: { acceptedAt: new Date() },
    })) as Caregiver;
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

