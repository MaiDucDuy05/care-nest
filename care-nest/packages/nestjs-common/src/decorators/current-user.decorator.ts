import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface JwtUser {
  id: string;
  sub: string;
  userId?: string;
  roles: string[];
  role?: string;
  email?: string;
  tenantId?: string | null;
  sessionId?: string;
  [key: string]: unknown;
}

/**
 * Inject the authenticated user or a specific field of the user.
 *
 * @example
 *   @Get('me')
 *   getMe(@CurrentUser() user: JwtUser)
 *
 * @example
 *   @Get('id')
 *   getId(@CurrentUser('id') id: string)
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request & { user?: JwtUser }>();
    const user = req.user;
    if (!user) return undefined;
    return data ? (user as Record<string, unknown>)[data] : user;
  },
);

