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
   * Phase 3 will add proper invite email flow.
   */
  async invite(userId: string, dto: CaregiverInviteDto): Promise<any> {
    const prisma = getPrismaClient();

    // Lookup caretaker by email
    const caretaker = await prisma.user.findUnique({ where: { email: dto.caretakerEmail } });
    if (!caretaker) {
      throw new NotFoundException(`Không tìm thấy tài khoản với email ${dto.caretakerEmail}`);
    }

    if (caretaker.id === userId) {
      throw new ConflictException('Không thể tự mời chính mình làm caregiver');
    }

    return this.repository.create({
      userId,
      caretakerId: caretaker.id,
      relationship: dto.relationship,
      permissions: dto.permissions,
    });
  }

  /**
   * List all caregivers for the current user.
   */
  async listMine(userId: string): Promise<any> {
    return this.repository.listForUser(userId);
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
