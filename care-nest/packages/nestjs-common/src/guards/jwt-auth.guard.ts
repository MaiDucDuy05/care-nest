import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import type { JwtUser } from '../decorators/current-user.decorator.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly jwtService: JwtService;

  constructor(
    @Optional() private readonly reflector?: Reflector,
    @Optional() jwtService?: JwtService,
  ) {
    this.jwtService = jwtService ?? new JwtService();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector) {
      const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      if (isPublic) return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const auth = request.headers?.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = auth.substring(7);
    try {
      const payload = await this.jwtService.verifyAsync<Record<string, unknown>>(token, {
        secret: process.env.JWT_SECRET || 'care-nest-jwt-secret-dev-2026',
      });

      const id = (payload.sub ?? payload.id ?? payload.userId) as string;
      const role = (payload.role ?? (Array.isArray(payload.roles) ? payload.roles[0] : undefined)) as string | undefined;
      const roles = (Array.isArray(payload.roles) ? payload.roles : role ? [role] : []) as string[];

      const user: JwtUser = {
        ...payload,
        id,
        sub: id,
        userId: id,
        role,
        roles,
      };

      (request as any).user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  handleRequest<TUser = unknown>(err: unknown, user: TUser | false): TUser {
    if (err || !user) {
      throw err instanceof Error ? err : new UnauthorizedException('Missing or invalid Authorization header');
    }
    return user as TUser;
  }
}

