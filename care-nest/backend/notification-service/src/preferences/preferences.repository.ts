import { Injectable } from '@nestjs/common';
import { getPrismaClient, PrismaClient } from '@carenest/database';
import type { NotificationPreference } from '@carenest/database';
import { DEFAULT_CHANNELS } from './dto/preference.dto.js';

@Injectable()
export class PreferencesRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  /**
   * Find preference row for a user.
   * Returns null if user has no row (caller should apply defaults).
   */
  async findByUserId(userId: string): Promise<NotificationPreference | null> {
    return (await this.prisma.notificationPreference.findUnique({
      where: { userId },
    })) as NotificationPreference | null;
  }

  /**
   * Upsert — create with all defaults, or update partial channels.
   * For updates, performs a deep-merge so missing categories stay intact.
   */
  async upsert(userId: string, channels: Record<string, Record<string, boolean>>): Promise<NotificationPreference> {
    const existing = await this.findByUserId(userId);
    if (!existing) {
      return (await this.prisma.notificationPreference.create({
        data: { userId, channels },
      })) as NotificationPreference;
    }
    // Deep-merge existing with incoming
    const merged: Record<string, Record<string, boolean>> = {};
    for (const cat of Object.keys(DEFAULT_CHANNELS)) {
      merged[cat] = {
        ...(existing.channels as Record<string, Record<string, boolean>>)[cat],
        ...channels[cat],
      };
    }
    return (await this.prisma.notificationPreference.update({
      where: { userId },
      data: { channels: merged },
    })) as NotificationPreference;
  }
}
