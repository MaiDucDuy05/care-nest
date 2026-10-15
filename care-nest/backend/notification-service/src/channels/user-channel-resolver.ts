import { Injectable, Logger } from '@nestjs/common';
import { getPrismaClient, PrismaClient } from '@carenest/database';

export interface UserContactInfo {
  userId: string;
  email?: string;
  phone?: string;
  /**
   * Web Push subscription JSON. Phase 2: not yet stored on User; reserved
   * for Phase 3 when we add a `notification_subscriptions` table. The
   * dispatcher already handles the case where these are missing.
   */
  deviceToken?: string;
  zaloUserId?: string;
  preferredChannel?: 'ZNS' | 'PUSH' | 'SMS' | 'EMAIL';
}

/**
 * Looks up the contact info needed to deliver a notification to a user.
 *
 * Phase 2: only `email` and `phone` are populated from the User table.
 * `deviceToken` and `zaloUserId` will come from a dedicated
 * `notification_subscriptions` table in Phase 3 — for now the dispatcher
 * treats them as optional and falls back to email.
 */
@Injectable()
export class UserChannelResolver {
  private readonly logger = new Logger(UserChannelResolver.name);
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  async resolve(userId: string): Promise<UserContactInfo> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, phone: true },
    });
    if (!user) return { userId };
    return {
      userId: user.id,
      email: user.email ?? undefined,
      phone: user.phone ?? undefined,
    };
  }
}
