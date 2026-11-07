import { Injectable } from '@nestjs/common';
import { getPrismaClient, PrismaClient } from '@carenest/database';
import type { Caregiver } from '@carenest/database';

const CARETAKER_SELECT = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
} as const;

@Injectable()
export class CaregiversRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  async findById(id: string): Promise<Caregiver | null> {
    return (await this.prisma.caregiver.findUnique({ where: { id } })) as Caregiver | null;
  }

  async findByUserAndCaretaker(userId: string, caretakerId: string): Promise<Caregiver | null> {
    return (await this.prisma.caregiver.findUnique({
      where: { userId_caretakerId: { userId, caretakerId } },
    })) as Caregiver | null;
  }

  /**
   * Create a new pending caregiver link (acceptedAt stays null — the
   * caretaker must explicitly accept before gaining any access).
   */
  async createPending(data: {
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
      include: { caretaker: { select: CARETAKER_SELECT } },
    })) as Caregiver;
  }

  /**
   * Reset a previously revoked link back to pending (re-invite). Only valid
   * when the existing row is revoked — callers must check that first.
   */
  async reinvitePending(
    id: string,
    data: { relationship: string; permissions: Record<string, boolean> },
  ): Promise<Caregiver> {
    return (await this.prisma.caregiver.update({
      where: { id },
      data: {
        relationship: data.relationship,
        permissions: data.permissions,
        revokedAt: null,
        acceptedAt: null,
        invitedAt: new Date(),
      },
      include: { caretaker: { select: CARETAKER_SELECT } },
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
      include: { caretaker: { select: CARETAKER_SELECT } },
    });
  }

  /**
   * List pending (not yet accepted, not revoked) invitations addressed to
   * this caretaker, including the inviting patient's details.
   */
  async findPendingForCaretaker(caretakerId: string): Promise<any[]> {
    return await this.prisma.caregiver.findMany({
      where: { caretakerId, acceptedAt: null, revokedAt: null },
      orderBy: { invitedAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
      },
    });
  }

  /**
   * List accepted, not-revoked links where the user is the caretaker.
   * Includes patient (user) details and their active devices.
   */
  async listForCaretaker(caretakerId: string): Promise<any[]> {
    return await this.prisma.caregiver.findMany({
      where: { caretakerId, acceptedAt: { not: null }, revokedAt: null },
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
              include: { device: true },
            },
          },
        },
      },
    });
  }

  /** Accept an invitation as a caretaker. */
  async accept(id: string): Promise<Caregiver> {
    return (await this.prisma.caregiver.update({
      where: { id },
      data: { acceptedAt: new Date() },
    })) as Caregiver;
  }

  /** Revoke (or decline) a caregiver link — reused for both actions. */
  async revoke(id: string): Promise<Caregiver> {
    return (await this.prisma.caregiver.update({
      where: { id },
      data: { revokedAt: new Date() },
    })) as Caregiver;
  }

  async touchInvitedAt(id: string): Promise<Caregiver> {
    return (await this.prisma.caregiver.update({
      where: { id },
      data: { invitedAt: new Date() },
    })) as Caregiver;
  }

  async updatePermissions(id: string, permissions: Record<string, boolean>): Promise<Caregiver> {
    return (await this.prisma.caregiver.update({
      where: { id },
      data: { permissions },
    })) as Caregiver;
  }
}
