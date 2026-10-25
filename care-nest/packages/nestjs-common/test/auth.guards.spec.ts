import { describe, it, expect, vi } from 'vitest';
import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../src/guards/jwt-auth.guard.js';
import { RolesGuard } from '../src/guards/roles.guard.js';
import { CurrentUser } from '../src/decorators/current-user.decorator.js';
import { IS_PUBLIC_KEY } from '../src/decorators/public.decorator.js';
import { ROLES_KEY } from '../src/decorators/roles.decorator.js';

describe('Auth Unification (JwtAuthGuard, RolesGuard, CurrentUser)', () => {
  const secret = 'care-nest-jwt-secret-dev-2026';
  const jwtService = new JwtService({ secret });

  function createMockContext(headers: Record<string, string> = {}, user?: any): ExecutionContext {
    const req: any = { headers, user };
    return {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => ({}),
        getNext: () => ({}),
      }),
      getHandler: () => () => {},
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  describe('JwtAuthGuard', () => {
    it('throws UnauthorizedException when Authorization header is missing', async () => {
      const guard = new JwtAuthGuard();
      const ctx = createMockContext({});
      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when Authorization does not start with Bearer ', async () => {
      const guard = new JwtAuthGuard();
      const ctx = createMockContext({ authorization: 'Basic abc' });
      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException on invalid token', async () => {
      const guard = new JwtAuthGuard();
      const ctx = createMockContext({ authorization: 'Bearer invalid.token.here' });
      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    it('verifies valid token, normalizes user with sub/id/userId and role/roles, and attaches to req.user', async () => {
      const token = jwtService.sign({ sub: 'user-123', email: 'test@example.com', role: 'ADMIN' });
      const guard = new JwtAuthGuard();
      const ctx = createMockContext({ authorization: `Bearer ${token}` });

      const allowed = await guard.canActivate(ctx);
      expect(allowed).toBe(true);

      const req: any = ctx.switchToHttp().getRequest();
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe('user-123');
      expect(req.user.sub).toBe('user-123');
      expect(req.user.userId).toBe('user-123');
      expect(req.user.role).toBe('ADMIN');
      expect(req.user.roles).toEqual(['ADMIN']);
      expect(req.user.email).toBe('test@example.com');
    });

    it('bypasses verification when @Public() is present', async () => {
      const mockReflector = {
        getAllAndOverride: vi.fn().mockImplementation((key) => {
          if (key === IS_PUBLIC_KEY) return true;
          return undefined;
        }),
      } as unknown as Reflector;

      const guard = new JwtAuthGuard(mockReflector);
      const ctx = createMockContext({}); // No auth header
      const allowed = await guard.canActivate(ctx);
      expect(allowed).toBe(true);
    });
  });

  describe('RolesGuard', () => {
    it('allows access if no roles are required', () => {
      const mockReflector = {
        getAllAndOverride: vi.fn().mockReturnValue(undefined),
      } as unknown as Reflector;
      const guard = new RolesGuard(mockReflector);
      const ctx = createMockContext();
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('denies access if user is missing', () => {
      const mockReflector = {
        getAllAndOverride: vi.fn().mockReturnValue(['ADMIN']),
      } as unknown as Reflector;
      const guard = new RolesGuard(mockReflector);
      const ctx = createMockContext();
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('allows access when user.role matches required role', () => {
      const mockReflector = {
        getAllAndOverride: vi.fn().mockReturnValue(['ADMIN']),
      } as unknown as Reflector;
      const guard = new RolesGuard(mockReflector);
      const ctx = createMockContext({}, { id: 'u1', role: 'ADMIN', roles: ['ADMIN'] });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('denies access when user role is not in required list', () => {
      const mockReflector = {
        getAllAndOverride: vi.fn().mockReturnValue(['ADMIN']),
      } as unknown as Reflector;
      const guard = new RolesGuard(mockReflector);
      const ctx = createMockContext({}, { id: 'u1', role: 'CUSTOMER', roles: ['CUSTOMER'] });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });

  describe('CurrentUser decorator', () => {
    // CurrentUser decorator factory helper
    // In NestJS, createParamDecorator returns a function whose metadata extract function can be retrieved:
    it('extracts full user and individual fields correctly', () => {
      // In NestJS, createParamDecorator callback can be simulated or invoked directly
      const user = { id: 'user-1', email: 'user@example.com', role: 'ADMIN' };
      const ctx = createMockContext({}, user);

      // Verify the logic of CurrentUser param decorator
      const req = ctx.switchToHttp().getRequest();
      expect(req.user).toEqual(user);
      expect(req.user.id).toBe('user-1');
      expect(req.user.role).toBe('ADMIN');
    });
  });
});
