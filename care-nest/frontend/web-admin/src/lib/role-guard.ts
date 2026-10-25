export type AdminRole = 'ADMIN' | 'MEDICAL_REVIEWER';

export const ADMIN_ROLES: AdminRole[] = ['ADMIN', 'MEDICAL_REVIEWER'];

export function isAdmin(role: string): role is AdminRole {
  return ADMIN_ROLES.includes(role as AdminRole);
}

export function canReviewProducts(role: string): boolean {
  return role === 'ADMIN' || role === 'MEDICAL_REVIEWER';
}

export function canExportAudit(role: string): boolean {
  return role === 'ADMIN';
}

export function canManageUsers(role: string): boolean {
  return role === 'ADMIN';
}

export function canManageAdmins(role: string): boolean {
  return role === 'ADMIN';
}
