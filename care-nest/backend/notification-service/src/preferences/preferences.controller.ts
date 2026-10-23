import { Controller, Get, Patch, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { PreferencesService } from './preferences.service.js';
import { UpdatePreferencesSchema } from './dto/preference.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('notifications/preferences')
@UseGuards(JwtAuthGuard)
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get()
  async get(@CurrentUser() user: { id: string }): Promise<Record<string, Record<string, boolean>>> {
    return this.preferencesService.getForUser(user.id);
  }

  @Patch()
  async update(
    @CurrentUser() user: { id: string },
    @Body() body: unknown,
  ): Promise<Record<string, Record<string, boolean>>> {
    const parsed = UpdatePreferencesSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    return this.preferencesService.updateForUser(user.id, parsed.data);
  }
}
