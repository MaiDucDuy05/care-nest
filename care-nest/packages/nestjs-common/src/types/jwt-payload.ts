export interface JwtPayload {
  sub: string;
  tenantId?: string | null;
  roles: string[];
  email?: string;
  iat?: number;
  exp?: number;
  jti?: string;
}
