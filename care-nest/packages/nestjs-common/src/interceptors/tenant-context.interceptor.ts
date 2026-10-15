import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Observable, from, switchMap } from 'rxjs';
import type { Request } from 'express';
import { AsyncLocalStorage } from 'node:async_hooks';
import { withTenantContext, getCurrentTenantId } from '@carenest/prisma-client';
import { TENANT_ASYNC_STORAGE } from '../tokens.js';
import type { JwtUser } from '../decorators/current-user.decorator.js';

/**
 * Wraps each HTTP request in `withTenantContext(...)` so the Prisma tenant
 * middleware can read the tenant id from AsyncLocalStorage.
 *
 * The tenant id is taken from the JWT (req.user.tenantId) or the X-Tenant-Id
 * header. If neither is set, the request runs in a `null` tenant context —
 * which means the middleware will NOT auto-filter. Use this for
 * cross-tenant admin endpoints and explicit raw queries.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(@Inject(TENANT_ASYNC_STORAGE) private readonly _als: AsyncLocalStorage<unknown>) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest<Request & { user?: JwtUser }>();
    const tenantId = req.user?.tenantId
      ?? (typeof req.headers['x-tenant-id'] === 'string' ? req.headers['x-tenant-id'] : null);

    // We can already see the current tenant in this request because every
    // request handler runs inside the same ALS instance once it has been set.
    // The check below is just to confirm wiring.
    if (getCurrentTenantId() !== null) return next.handle();

    return from(
      withTenantContext(tenantId, async () => {
        const result = await new Promise<unknown>((resolve, reject) => {
          next.handle().subscribe({
            next: (v) => resolve(v),
            error: (e) => reject(e),
            complete: () => resolve(undefined),
          });
        });
        return result;
      }),
    );
  }
}
