import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark an endpoint as not requiring authentication. `JwtAuthGuard` skips it.
 *
 * @example
 *   @Public()
 *   @Post('login')
 *   login() {}
 */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);
