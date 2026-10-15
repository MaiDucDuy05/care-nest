import { describe, it, expect } from 'vitest';
import { AuthService } from '../src/auth/auth.service.js';

describe('AuthService', () => {
  it('should be defined', () => {
    const mockUsersService = {} as any;
    const mockJwtService = {} as any;
    const authService = new AuthService(mockUsersService, mockJwtService);
    expect(authService).toBeDefined();
  });
});
