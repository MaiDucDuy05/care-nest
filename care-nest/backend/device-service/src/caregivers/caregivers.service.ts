import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { CaregiversRepository } from './caregivers.repository.js';
import { getPrismaClient } from '@carenest/database';
import type { CaregiverInviteDto } from './dto/caregiver.dto.js';

@Injectable()
export class CaregiversService {
  constructor(
    private readonly repository: CaregiversRepository,
  ) {}

  /**
   * Invite a caretaker by email. The caretaker must already have an account.
   */
  async invite(userId: string, dto: CaregiverInviteDto): Promise<any> {
    const prisma = getPrismaClient();

    // Lookup caretaker by email
    const caretaker = await prisma.user.findUnique({ where: { email: dto.caretakerEmail.toLowerCase().trim() } });
    if (!caretaker) {
      throw new NotFoundException(`Không tìm thấy tài khoản với email ${dto.caretakerEmail}. Vui lòng kiểm tra lại email.`);
    }

    if (caretaker.id === userId) {
      throw new ConflictException('Không thể tự mời chính mình làm caregiver');
    }

    const created = await this.repository.create({
      userId,
      caretakerId: caretaker.id,
      relationship: dto.relationship,
      permissions: dto.permissions,
    });

    const c = created as any;
    return {
      id: c.id,
      userId: c.userId,
      caretakerId: c.caretakerId,
      email: c.caretaker?.email || caretaker.email,
      fullName: c.caretaker?.fullName || caretaker.fullName || caretaker.email,
      phone: c.caretaker?.phone || caretaker.phone || '',
      relationship: c.relationship,
      permissions: c.permissions,
      status: c.revokedAt ? 'REVOKED' : c.acceptedAt ? 'ACCEPTED' : 'PENDING',
      invitedAt: c.invitedAt,
      acceptedAt: c.acceptedAt,
    };
  }

  /**
   * List all caregivers invited by the current user.
   */
  async listMine(userId: string): Promise<any[]> {
    const items = await this.repository.listForUser(userId);
    return items.map((c) => ({
      id: c.id,
      userId: c.userId,
      caretakerId: c.caretakerId,
      email: c.caretaker?.email || '',
      fullName: c.caretaker?.fullName || c.caretaker?.email || 'Người chăm sóc',
      phone: c.caretaker?.phone || '',
      relationship: c.relationship,
      permissions: c.permissions,
      status: c.revokedAt ? 'REVOKED' : c.acceptedAt ? 'ACCEPTED' : 'PENDING',
      invitedAt: c.invitedAt,
      acceptedAt: c.acceptedAt,
    }));
  }

  /**
   * List all patients / family members who invited the current user as caretaker.
   * Also returns active devices assigned to each patient.
   */
  async listPatients(caretakerId: string): Promise<any[]> {
    const items = await this.repository.listForCaretaker(caretakerId);
    return items.map((c) => {
      const patient = c.user;
      const assignments = patient?.deviceAssignments || [];
      const devices = assignments.map((a: any) => ({
        ...a.device,
        assignmentId: a.id,
        patientId: patient.id,
        patientName: patient.fullName || patient.email,
        patientPhone: patient.phone,
        relationship: c.relationship,
        permissions: c.permissions,
      }));

      return {
        id: c.id,
        patientId: patient.id,
        fullName: patient.fullName || patient.email,
        email: patient.email,
        phone: patient.phone,
        relationship: c.relationship,
        permissions: c.permissions,
        status: c.revokedAt ? 'REVOKED' : c.acceptedAt ? 'ACCEPTED' : 'PENDING',
        invitedAt: c.invitedAt,
        acceptedAt: c.acceptedAt,
        devices,
      };
    });
  }

  /**
   * Accept an invitation as caretaker.
   */
  async accept(caretakerId: string, caregiverId: string): Promise<any> {
    const existing = await this.repository.listForCaretaker(caretakerId);
    const found = existing.find((c) => (c as any).id === caregiverId);
    if (!found) {
      throw new ForbiddenException('Bạn không có lời mời này để chấp nhận');
    }
    return this.repository.accept(caregiverId, caretakerId);
  }

  /**
   * Revoke a caregiver link. Only the owner can revoke.
   */
  async revoke(userId: string, caregiverId: string): Promise<any> {
    const existing = await this.repository.listForUser(userId);
    const found = existing.find((c) => (c as any).id === caregiverId);
    if (!found) {
      throw new ForbiddenException('Bạn không có quyền xoá caregiver này');
    }
    return this.repository.revoke(caregiverId, userId);
  }
}

