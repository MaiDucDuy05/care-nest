import { Controller, Get, Post, Put, Patch, Delete, Param, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { GeofenceService } from './geofence.service.js';
import { CreateGeofenceSchema, UpdateGeofenceSchema } from './geofence.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('geofences')
@UseGuards(JwtAuthGuard)
export class GeofenceController {
  constructor(private readonly geofenceService: GeofenceService) {}

  @Get()
  async list(@CurrentUser() user: { id: string }): Promise<any> {
    return this.geofenceService.listForUser(user.id);
  }

  @Post()
  async create(@CurrentUser() user: { id: string }, @Body() body: unknown): Promise<any> {
    const parsed = CreateGeofenceSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.errors);
    return this.geofenceService.create(user.id, parsed.data);
  }

  @Patch(':id')
  async patchUpdate(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<any> {
    const parsed = UpdateGeofenceSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.errors);
    return this.geofenceService.update(id, user.id, parsed.data);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<any> {
    const parsed = UpdateGeofenceSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.errors);
    return this.geofenceService.update(id, user.id, parsed.data);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: { id: string }, @Param('id') id: string): Promise<any> {
    return this.geofenceService.softDelete(id, user.id);
  }
}
