import { Injectable, ForbiddenException } from '@nestjs/common';
import { getPrismaClient, assertCareAccess, CareAccessDeniedError, type CarePermission } from '@carenest/database';

/** Thin Nest wrapper around the shared care-access policy for alert-service. */
@Injectable()
export class CareAccessService {
  private readonly prisma = getPrismaClient();

  async assertSubjectAccess(callerId: string, subjectId: string, permission: CarePermission): Promise<void> {
    try {
      await assertCareAccess(this.prisma, callerId, subjectId, permission);
    } catch (err) {
      if (err instanceof CareAccessDeniedError) {
        throw new ForbiddenException('Bạn không có quyền truy cập cảnh báo này');
      }
      throw err;
    }
  }
}
