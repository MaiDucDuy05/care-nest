import { Controller, Get, Post, Param, Query, Body, BadRequestException, UseGuards } from '@nestjs/common';
import { AlertsService } from './alerts.service.js';
import { UpdateAlertStatusSchema } from './dto/alert.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('api/v1/alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  async list(
    @CurrentUser() user: { id: string; role?: string },
    @Query('subjectId') subjectId?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ): Promise<any> {
    const p = parseInt(page, 10) || 1;
    const ps = Math.min(parseInt(pageSize, 10) || 20, 100);
    if (subjectId) return this.alertsService.listForSubject(subjectId, p, ps);
    if (user.role === 'ADMIN' || user.role === 'SUPPORT') {
      return this.alertsService.listOpen(p, ps);
    }
    return this.alertsService.listForSubject(user.id, p, ps);
  }

  @Get(':id')
  async getOne(@Param('id') id: string): Promise<any> {
    return this.alertsService.listForSubject(id, 1, 1);
  }

  @Post(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: unknown): Promise<any> {
    const parsed = UpdateAlertStatusSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    return this.alertsService.updateStatus(id, parsed.data);
  }
}
