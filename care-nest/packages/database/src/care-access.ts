/**
 * Shared care-access policy used by device-service and alert-service
 * (both depend on this package and share the same Prisma DB). A single
 * rule: the caller may act on a subject's health data if the caller IS
 * the subject, or is an accepted, non-revoked `Caregiver` of the subject
 * with the relevant permission granted.
 */
import type { PrismaClient } from '@prisma/client';

export type CarePermission = 'viewHealth' | 'receiveAlerts' | 'manageDevices';

export class CareAccessDeniedError extends Error {
  constructor(subjectId: string, permission: CarePermission) {
    super(`Caller lacks '${permission}' access to subject ${subjectId}`);
    this.name = 'CareAccessDeniedError';
  }
}

/**
 * A legacy/empty `permissions` JSON (no keys at all) defaults to full
 * access: every pre-existing `Caregiver` row was created under the old
 * auto-accept flow, which always set all three permissions true. Treating
 * an empty object as "allow" preserves those callers' existing access
 * instead of silently revoking it. A permissions object that DOES have
 * the key but sets it false is always honored.
 */
function hasPermission(permissions: unknown, permission: CarePermission): boolean {
  const p = typeof permissions === 'object' && permissions !== null ? (permissions as Record<string, unknown>) : {};
  if (permission in p) return p[permission] === true;
  return true;
}

/**
 * Throws CareAccessDeniedError unless callerId === subjectId, or callerId
 * is an accepted, non-revoked caregiver of subjectId with `permission`.
 */
export async function assertCareAccess(
  prisma: PrismaClient,
  callerId: string,
  subjectId: string,
  permission: CarePermission,
): Promise<void> {
  if (callerId === subjectId) return;

  const link = await prisma.caregiver.findUnique({
    where: { userId_caretakerId: { userId: subjectId, caretakerId: callerId } },
    select: { acceptedAt: true, revokedAt: true, permissions: true },
  });

  if (!link || !link.acceptedAt || link.revokedAt || !hasPermission(link.permissions, permission)) {
    throw new CareAccessDeniedError(subjectId, permission);
  }
}

/**
 * Resolves the owning user (subject) of a device via its active
 * DeviceAssignment. Returns null if the device has no active assignment.
 */
export async function resolveDeviceSubject(prisma: PrismaClient, deviceId: string): Promise<string | null> {
  const assignment = await prisma.deviceAssignment.findFirst({
    where: { deviceId, unassignedAt: null },
    select: { userId: true },
    orderBy: { assignedAt: 'desc' },
  });
  return assignment?.userId ?? null;
}

/**
 * Caretaker ids with an accepted, non-revoked link to subjectId and the
 * given permission granted — used for realtime fan-out (e.g. alerts).
 */
export async function listCaregiverIdsFor(
  prisma: PrismaClient,
  subjectId: string,
  permission: CarePermission,
): Promise<string[]> {
  const links = await prisma.caregiver.findMany({
    where: { userId: subjectId, acceptedAt: { not: null }, revokedAt: null },
    select: { caretakerId: true, permissions: true },
  });
  return links.filter((l) => hasPermission(l.permissions, permission)).map((l) => l.caretakerId);
}
