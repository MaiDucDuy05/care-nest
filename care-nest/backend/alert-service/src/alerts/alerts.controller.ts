import { Controller, Get, Post, Param, Query, Body, BadRequestException, UseGuards } from '@nestjs/common';
import { Roles, RolesGuard } from '@carenest/nestjs-common';
import { AlertsService } from './alerts.service.js';
import { UpdateAlertStatusSchema } from './dto/alert.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('alerts')
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
    if (subjectId) {
      if (subjectId === user.id || user.role === 'ADMIN') {
        return this.alertsService.listForSubject(subjectId, p, ps);
      }
      return this.alertsService.listForSubjectChecked(user.id, subjectId, p, ps);
    }
    if (user.role === 'ADMIN') {
      return this.alertsService.listOpen(p, ps);
    }
    return this.alertsService.listForSubject(user.id, p, ps);
  }

  @Get('counts')
  async counts(
    @CurrentUser() user: { id: string },
    @Query('subjectIds') subjectIds?: string,
  ): Promise<Record<string, number>> {
    const ids = (subjectIds || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) return {};
    return this.alertsService.getOpenCountsForSubjects(user.id, ids);
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async listAdmin(@Query() query: any): Promise<any> {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 50, 100);
    return this.alertsService.listAdmin(page, limit, query);
  }

  @Get(':id')
  async getOne(@CurrentUser() user: { id: string }, @Param('id') id: string): Promise<any> {
    return this.alertsService.getByIdChecked(user.id, id);
  }

  @Post(':id/status')
  async updateStatus(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<any> {
    const parsed = UpdateAlertStatusSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    return this.alertsService.updateStatus(user.id, id, parsed.data);
  }
}
