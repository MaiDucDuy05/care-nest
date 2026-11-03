import { Controller, Get, Post, Delete, Param, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { CaregiversService } from './caregivers.service.js';
import { CaregiverInviteSchema } from './dto/caregiver.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('caregivers')
@UseGuards(JwtAuthGuard)
export class CaregiversController {
  constructor(private readonly caregiversService: CaregiversService) {}

  @Post()
  async invite(@CurrentUser() user: { id: string }, @Body() body: unknown): Promise<any> {
    const raw = (body && typeof body === 'object' ? body : {}) as Record<string, any>;
    const normalized = {
      caretakerEmail: raw.caretakerEmail || raw.email,
      relationship: raw.relationship || 'FAMILY',
      permissions: raw.permissions || { viewHealth: true, receiveAlerts: true, manageDevices: true },
    };

    const parsed = CaregiverInviteSchema.safeParse(normalized);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    return this.caregiversService.invite(user.id, parsed.data);
  }

  @Get()
  async list(@CurrentUser() user: { id: string }): Promise<any> {
    return this.caregiversService.listMine(user.id);
  }

  @Get('me')
  async listMine(@CurrentUser() user: { id: string }): Promise<any> {
    return this.caregiversService.listMine(user.id);
  }

  @Get('patients')
  async listPatients(@CurrentUser() user: { id: string }): Promise<any> {
    return this.caregiversService.listPatients(user.id);
  }

  @Post(':id/accept')
  async accept(@CurrentUser() user: { id: string }, @Param('id') id: string): Promise<any> {
    return this.caregiversService.accept(user.id, id);
  }

  @Delete(':id')
  async revoke(@CurrentUser() user: { id: string }, @Param('id') id: string): Promise<any> {
    return this.caregiversService.revoke(user.id, id);
  }

  @Post(':id/resend')
  async resend(@CurrentUser() _user: { id: string }, @Param('id') id: string): Promise<any> {
    return { success: true, caregiverId: id, resentAt: new Date().toISOString() };
  }
}

