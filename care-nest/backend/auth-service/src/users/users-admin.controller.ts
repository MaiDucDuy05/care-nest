import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { UserRole } from '@carenest/database';
import { CurrentUser, type JwtUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { UsersService } from './users.service.js';

const UpdateRoleSchema = z.object({ role: z.nativeEnum(UserRole) });
const SuspendSchema = z.object({ reason: z.string().trim().max(500).optional() }).default({});

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class UsersAdminController {
  constructor(private readonly usersService: UsersService) {}

  @Get('admin')
  async list(@Query() query: Record<string, string | undefined>) {
    const page = this.parsePositiveInteger(query.page, 'page', 1);
    const limit = Math.min(this.parsePositiveInteger(query.limit, 'limit', 50), 100);
    return this.usersService.listForAdmin({
      page,
      limit,
      search: query.search?.trim() || undefined,
      role: query.role || undefined,
      status: query.status || undefined,
    });
  }

  @Get('admin/:userId')
  async getById(@Param('userId', new ParseUUIDPipe()) userId: string): Promise<any> {
    return this.usersService.getForAdmin(userId);
  }

  @Post('admin/:userId/suspend')
  async suspend(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @CurrentUser() actor: JwtUser,
    @Body() body: unknown,
  ) {
    const parsed = SuspendSchema.safeParse(body ?? {});
    if (!parsed.success) throw new BadRequestException(parsed.error.errors);
    const actorId = actor.userId ?? actor.id ?? actor.sub;
    return this.usersService.suspendForAdmin(userId, actorId, parsed.data.reason || 'Suspended by admin');
  }

  @Post('admin/:userId/unsuspend')
  async unsuspend(@Param('userId', new ParseUUIDPipe()) userId: string) {
    return this.usersService.unsuspendForAdmin(userId);
  }

  @Put('admin/:userId/role')
  async updateRole(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @CurrentUser() actor: JwtUser,
    @Body() body: unknown,
  ) {
    const parsed = UpdateRoleSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.errors);
    const actorId = actor.userId ?? actor.id ?? actor.sub;
    return this.usersService.updateRoleForAdmin(userId, actorId, parsed.data.role);
  }

  private parsePositiveInteger(value: string | undefined, field: string, fallback: number): number {
    if (value === undefined || value === '') return fallback;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new BadRequestException(`${field} must be a positive integer`);
    }
    return parsed;
  }
}
