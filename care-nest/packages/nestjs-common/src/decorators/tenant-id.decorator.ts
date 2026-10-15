import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Pull the tenant id from the JWT, the `X-Tenant-Id` header, or the route
 * param `:tenantId`. Throws 400 if none provided.
 *
 * Tenant resolution order:
 *   1. JWT claim (if authenticated and present)
 *   2. X-Tenant-Id header
 *   3. :tenantId route param
 *   4. body.tenantId
 */
export const TenantId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest<Request & {
    user?: { tenantId?: string | null };
    params?: Record<string, string>;
    body?: { tenantId?: string };
    headers: Record<string, string | string[] | undefined>;
  }>();

  const fromJwt = req.user?.tenantId;
  if (fromJwt) return fromJwt;

  const fromHeader = req.headers['x-tenant-id'];
  if (typeof fromHeader === 'string' && fromHeader.length > 0) return fromHeader;

  if (req.params?.tenantId) return req.params.tenantId;

  if (req.body?.tenantId) return req.body.tenantId;

  throw new BadRequestException('tenantId is required');
});
