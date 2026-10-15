import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Restrict an endpoint to a set of roles. `RolesGuard` reads this metadata.
 *
 * @example
 *   @Roles('ADMIN', 'PLATFORM_ADMIN')
 *   @Get('admin/secret')
 *   adminSecret() {}
 */
export const Roles = (...roles: string[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
