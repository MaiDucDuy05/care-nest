import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator that extracts the authenticated user from the JWT auth guard.
 * Assumes the request has been decorated with `req.user` by the guard.
 *
 * The auth-service issues a JWT; downstream services verify the signature
 * using a shared secret. In Phase 1 the guard is a thin wrapper around
 * `passport-jwt` configured in each service.
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
