import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Inject the authenticated user. The shape is whatever `JwtStrategy.validate`
 * returned; by convention it matches `JwtPayload & { sub: string }`.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtUser | undefined => {
    const req = ctx.switchToHttp().getRequest<Request & { user?: JwtUser }>();
    return req.user;
  },
);

export interface JwtUser {
  sub: string;
  tenantId: string | null;
  roles: string[];
  email?: string;
  sessionId?: string;
}
