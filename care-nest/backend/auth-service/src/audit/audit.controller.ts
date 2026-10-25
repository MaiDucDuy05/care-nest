import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get(':entityType/:entityId')
  @Roles('ADMIN')
  async list(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
  ): Promise<any> {
    const p = parseInt(page, 10) || 1;
    const ps = Math.min(parseInt(pageSize, 10) || 50, 200);
    return this.auditService.listFor(entityType, entityId, p, ps);
  }
}
