import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CaregiversRepository } from './caregivers.repository.js';
import { CaregiverInviteNotificationPublisher } from './caregiver-invite-notification.publisher.js';
import { getPrismaClient } from '@carenest/database';
import type { CaregiverInviteDto, CaregiverPermissionsDto } from './dto/caregiver.dto.js';

const RESEND_THROTTLE_MS = 5 * 60 * 1000;

function toCaregiverStatus(c: { acceptedAt: Date | null; revokedAt: Date | null }): string {
  if (c.revokedAt) return 'REVOKED';
  if (c.acceptedAt) return 'ACCEPTED';
  return 'PENDING';
}

@Injectable()
export class CaregiversService {
  constructor(
    private readonly repository: CaregiversRepository,
    private readonly notifier: CaregiverInviteNotificationPublisher,
  ) {}

  /**
   * Invite a caretaker by email. The caretaker must already have an account.
   * The link starts PENDING — the caretaker must explicitly accept before
   * gaining any access (see accept()).
   */
  async invite(userId: string, dto: CaregiverInviteDto): Promise<any> {
    const prisma = getPrismaClient();

    const caretaker = await prisma.user.findUnique({
      where: { email: dto.caretakerEmail.toLowerCase().trim() },
    });
    if (!caretaker) {
      throw new NotFoundException(
        `Không tìm thấy tài khoản với email ${dto.caretakerEmail}. Vui lòng kiểm tra lại email.`,
      );
    }
    if (caretaker.id === userId) {
      throw new ConflictException('Không thể tự mời chính mình làm caregiver');
    }

    const existing = await this.repository.findByUserAndCaretaker(userId, caretaker.id);
    let created;
    if (!existing) {
      created = await this.repository.createPending({
        userId,
        caretakerId: caretaker.id,
        relationship: dto.relationship,
        permissions: dto.permissions,
      });
    } else if (!existing.revokedAt) {
      throw new ConflictException(
        existing.acceptedAt
          ? 'Người này đã là người chăm sóc của bạn'
          : 'Lời mời đến người này đang chờ xác nhận',
      );
    } else {
      // Previously revoked — re-inviting resets the link to pending.
      created = await this.repository.reinvitePending(existing.id, {
        relationship: dto.relationship,
        permissions: dto.permissions,
      });
    }

    const patient = await prisma.user.findUnique({ where: { id: userId } });
    const notificationQueued = await this.notifier.publishInvite({
      caregiverId: created.id,
      caretakerUserId: caretaker.id,
      inviterName: patient?.fullName || patient?.email || 'Một người dùng CareNest',
      relationship: created.relationship,
      invitedAt: created.invitedAt.toISOString(),
    });

    return { ...this.toInviteView(created, caretaker), notificationQueued };
  }

  /** List all caregivers invited by the current user (any non-revoked status). */
  async listMine(userId: string): Promise<any[]> {
    const items = await this.repository.listForUser(userId);
    return items.map((c) => this.toInviteView(c, c.caretaker));
  }

  /** Pending invitations addressed to the current user (as caretaker). */
  async listInvitations(caretakerId: string): Promise<any[]> {
    const items = await this.repository.findPendingForCaretaker(caretakerId);
    return items.map((c) => ({
      id: c.id,
      inviterUserId: c.user.id,
      inviterName: c.user.fullName || c.user.email,
      inviterEmail: c.user.email,
      relationship: c.relationship,
      permissions: c.permissions,
      invitedAt: c.invitedAt,
    }));
  }

  /**
   * List all patients / family members who invited the current user as
   * caretaker AND whom the current user has accepted. Includes active
   * devices assigned to each patient.
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
        status: toCaregiverStatus(c),
        invitedAt: c.invitedAt,
        acceptedAt: c.acceptedAt,
        devices,
      };
    });
  }

  /** Accept an invitation as caretaker. Idempotent if already accepted. */
  async accept(caretakerId: string, caregiverId: string): Promise<any> {
    const link = await this.loadOwnedByCaretaker(caregiverId, caretakerId);
    if (link.revokedAt) {
      throw new ConflictException('Lời mời này đã bị hủy');
    }
    if (link.acceptedAt) {
      return this.toInviteView(link, null);
    }
    const updated = await this.repository.accept(caregiverId);
    return this.toInviteView(updated, null);
  }

  /** Decline an invitation as caretaker (reuses the revoke column). */
  async decline(caretakerId: string, caregiverId: string): Promise<any> {
    const link = await this.loadOwnedByCaretaker(caregiverId, caretakerId);
    if (link.acceptedAt) {
      throw new ConflictException('Lời mời đã được chấp nhận trước đó — hãy dùng chức năng hủy liên kết.');
    }
    if (link.revokedAt) {
      return this.toInviteView(link, null);
    }
    const updated = await this.repository.revoke(caregiverId);
    return this.toInviteView(updated, null);
  }

  /** Revoke a caregiver link. Either the patient or the caretaker may revoke. */
  async revoke(callerId: string, caregiverId: string): Promise<any> {
    const link = await this.repository.findById(caregiverId);
    if (!link) throw new NotFoundException('Không tìm thấy liên kết này');
    if (link.userId !== callerId && link.caretakerId !== callerId) {
      throw new ForbiddenException('Bạn không có quyền xoá caregiver này');
    }
    if (link.revokedAt) return this.toInviteView(link, null);
    const updated = await this.repository.revoke(caregiverId);
    return this.toInviteView(updated, null);
  }

  /** Resend the invite notification. Only the inviting patient; throttled to 1/5min. */
  async resend(userId: string, caregiverId: string): Promise<{ success: boolean; resentAt: string; notificationQueued: boolean }> {
    const link = await this.repository.findById(caregiverId);
    if (!link) throw new NotFoundException('Không tìm thấy liên kết này');
    if (link.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền gửi lại lời mời này');
    }
    if (link.revokedAt) throw new ConflictException('Lời mời này đã bị hủy');
    if (link.acceptedAt) throw new ConflictException('Lời mời này đã được chấp nhận');

    const elapsed = Date.now() - link.invitedAt.getTime();
    if (elapsed < RESEND_THROTTLE_MS) {
      throw new HttpException('Vui lòng thử lại sau 5 phút.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const prisma = getPrismaClient();
    const [patient, caretaker] = await Promise.all([
      prisma.user.findUnique({ where: { id: link.userId } }),
      prisma.user.findUnique({ where: { id: link.caretakerId } }),
    ]);
    const updated = await this.repository.touchInvitedAt(caregiverId);
    const notificationQueued = caretaker
      ? await this.notifier.publishInvite({
          caregiverId: updated.id,
          caretakerUserId: link.caretakerId,
          inviterName: patient?.fullName || patient?.email || 'Một người dùng CareNest',
          relationship: updated.relationship,
          invitedAt: updated.invitedAt.toISOString(),
        })
      : false;

    return { success: true, resentAt: updated.invitedAt.toISOString(), notificationQueued };
  }

  /** Patient edits an existing (accepted, non-revoked) caregiver's permissions. */
  async updatePermissions(userId: string, caregiverId: string, permissions: CaregiverPermissionsDto): Promise<any> {
    const link = await this.repository.findById(caregiverId);
    if (!link) throw new NotFoundException('Không tìm thấy liên kết này');
    if (link.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền sửa quyền của caregiver này');
    }
    if (link.revokedAt) throw new ConflictException('Liên kết này đã bị hủy');
    if (!link.acceptedAt) throw new ConflictException('Caregiver chưa chấp nhận lời mời');

    const updated = await this.repository.updatePermissions(caregiverId, permissions);
    return this.toInviteView(updated, null);
  }

  private async loadOwnedByCaretaker(caregiverId: string, caretakerId: string) {
    const link = await this.repository.findById(caregiverId);
    if (!link) throw new NotFoundException('Không tìm thấy lời mời này');
    if (link.caretakerId !== caretakerId) {
      throw new ForbiddenException('Bạn không có lời mời này');
    }
    return link;
  }

  private toInviteView(c: any, caretaker: any): any {
    return {
      id: c.id,
      userId: c.userId,
      caretakerId: c.caretakerId,
      email: caretaker?.email || c.caretaker?.email || '',
      fullName: caretaker?.fullName || c.caretaker?.fullName || caretaker?.email || c.caretaker?.email || 'Người chăm sóc',
      phone: caretaker?.phone || c.caretaker?.phone || '',
      relationship: c.relationship,
      permissions: c.permissions,
      status: toCaregiverStatus(c),
      invitedAt: c.invitedAt,
      acceptedAt: c.acceptedAt,
    };
  }
}
