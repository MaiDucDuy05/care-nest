import { Injectable } from '@nestjs/common';
import { PreferencesRepository } from './preferences.repository.js';
import { DEFAULT_CHANNELS } from './dto/preference.dto.js';
import type { UpdatePreferencesDto } from './dto/preference.dto.js';

@Injectable()
export class PreferencesService {
  constructor(private readonly preferencesRepository: PreferencesRepository) {}

  /**
   * Get preferences for a user.
   * Returns default channels if no row exists yet.
   */
  async getForUser(userId: string): Promise<Record<string, Record<string, boolean>>> {
    const row = await this.preferencesRepository.findByUserId(userId);
    return row ? (row.channels as Record<string, Record<string, boolean>>) : DEFAULT_CHANNELS;
  }

  /**
   * Partially update preferences for a user.
   * Deep-merges incoming partial update with existing or default channels.
   */
  async updateForUser(
    userId: string,
    partial: UpdatePreferencesDto,
  ): Promise<Record<string, Record<string, boolean>>> {
    const current = await this.getForUser(userId);
    const merged: Record<string, Record<string, boolean>> = {};
    for (const cat of Object.keys(DEFAULT_CHANNELS)) {
      merged[cat] = {
        ...current[cat],
        ...(partial[cat as keyof UpdatePreferencesDto] ?? {}),
      };
    }
    const updated = await this.preferencesRepository.upsert(userId, merged);
    return updated.channels as Record<string, Record<string, boolean>>;
  }
}
