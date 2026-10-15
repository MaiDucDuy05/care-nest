import { Controller, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { MfaService } from './mfa.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

const MfaCodeSchema = z.object({ code: z.string().regex(/^\d{6}$/, 'Mã MFA phải gồm 6 chữ số') });

@Controller('api/v1/mfa')
@UseGuards(JwtAuthGuard)
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @Post('setup')
  async setup(@CurrentUser() user: { id: string }) {
    return this.mfaService.setup(user.id);
  }

  @Post('verify')
  async verify(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    const parsed = MfaCodeSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.errors);
    return this.mfaService.verifyAndEnable(user.id, parsed.data.code);
  }

  @Post('disable')
  async disable(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    const parsed = MfaCodeSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.errors);
    return this.mfaService.disable(user.id, parsed.data.code);
  }
}
