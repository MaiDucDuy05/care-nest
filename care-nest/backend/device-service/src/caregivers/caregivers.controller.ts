import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { CaregiversService } from './caregivers.service.js';
import { CaregiverInviteSchema, CaregiverPermissionsSchema } from './dto/caregiver.dto.js';
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

  @Get('invitations')
  async listInvitations(@CurrentUser() user: { id: string }): Promise<any> {
    return this.caregiversService.listInvitations(user.id);
  }

  @Get('patients')
  async listPatients(@CurrentUser() user: { id: string }): Promise<any> {
    return this.caregiversService.listPatients(user.id);
  }

  @Post(':id/accept')
  async accept(@CurrentUser() user: { id: string }, @Param('id') id: string): Promise<any> {
    return this.caregiversService.accept(user.id, id);
  }

  @Post(':id/decline')
  async decline(@CurrentUser() user: { id: string }, @Param('id') id: string): Promise<any> {
    return this.caregiversService.decline(user.id, id);
  }

  @Delete(':id')
  async revoke(@CurrentUser() user: { id: string }, @Param('id') id: string): Promise<any> {
    return this.caregiversService.revoke(user.id, id);
  }

  @Post(':id/resend')
  async resend(@CurrentUser() user: { id: string }, @Param('id') id: string): Promise<any> {
    return this.caregiversService.resend(user.id, id);
  }

  @Patch(':id/permissions')
  async updatePermissions(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<any> {
    const raw = (body && typeof body === 'object' ? body : {}) as Record<string, any>;
    const parsed = CaregiverPermissionsSchema.safeParse(raw.permissions || raw);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    return this.caregiversService.updatePermissions(user.id, id, parsed.data);
  }
}
