import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import type { JwtUser } from '../decorators/current-user.decorator.js';
import type { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Optional() private readonly reflector?: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    if (!this.reflector) return true;

    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = ctx.switchToHttp().getRequest<Request & { user?: JwtUser }>();
    const user = req.user;
    if (!user) {
      throw new ForbiddenException('Không có quyền truy cập');
    }

    const userRoles = user.roles ?? (user.role ? [user.role] : []);
    if (userRoles.length === 0) {
      throw new ForbiddenException('Không có quyền truy cập');
    }

    const ok = required.some((r) => userRoles.includes(r));
    if (!ok) {
      throw new ForbiddenException(`Yêu cầu vai trò: ${required.join(', ')}`);
    }
    return true;
  }
}

