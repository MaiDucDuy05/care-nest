import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  getPrismaClient,
  assertCareAccess,
  resolveDeviceSubject,
  CareAccessDeniedError,
  type CarePermission,
} from '@carenest/database';

/** Thin Nest wrapper around the shared care-access policy — maps domain
 * errors to HTTP exceptions so controllers don't need to know about
 * CareAccessDeniedError directly. */
@Injectable()
export class CareAccessService {
  private readonly prisma = getPrismaClient();

  /** Resolves deviceId -> subject, 404s if the device has no owner, then asserts access. */
  async assertDeviceAccess(callerId: string, deviceId: string, permission: CarePermission): Promise<string> {
    const subjectId = await resolveDeviceSubject(this.prisma, deviceId);
    if (!subjectId) {
      throw new NotFoundException(`Không tìm thấy thiết bị có id ${deviceId}`);
    }
    await this.assertSubjectAccess(callerId, subjectId, permission);
    return subjectId;
  }

  async assertSubjectAccess(callerId: string, subjectId: string, permission: CarePermission): Promise<void> {
    try {
      await assertCareAccess(this.prisma, callerId, subjectId, permission);
    } catch (err) {
      if (err instanceof CareAccessDeniedError) {
        throw new ForbiddenException('Bạn không có quyền truy cập dữ liệu này');
      }
      throw err;
    }
  }
}
