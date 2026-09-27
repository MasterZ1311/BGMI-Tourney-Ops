import { Role, ROLE_PERMISSIONS, checkPermission } from '@/lib/auth/roles';

export function getRequesterRole(req: Request): Role {
  const roleHeader = req.headers.get('x-user-role') || req.headers.get('x-role');
  if (roleHeader) {
    const roleUpper = roleHeader.trim().toUpperCase() as Role;
    if (ROLE_PERMISSIONS[roleUpper]) {
      return roleUpper;
    }
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim().toUpperCase() as Role;
    if (ROLE_PERMISSIONS[token]) {
      return token;
    }
  }

  try {
    const url = new URL(req.url);
    const roleQuery = url.searchParams.get('role')?.trim().toUpperCase() as Role;
    if (roleQuery && ROLE_PERMISSIONS[roleQuery]) {
      return roleQuery;
    }
  } catch {
    // URL parsing fallback
  }

  // Default to OBSERVER (least privilege) for unauthenticated requests
  return 'OBSERVER';
}

export function canViewerSeeRoomPassword(req: Request): boolean {
  // If the request specifically specifies a role or authorization header:
  const role = getRequesterRole(req);
  return checkPermission(role, 'canSeeRoomPasswords');
}

export function maskRoomPasswordIfNeeded<T extends { password?: string | null }>(
  room: T | null | undefined,
  canSee: boolean
): T | null | undefined {
  if (!room) return room;
  if (canSee) return room;

  return {
    ...room,
    password: room.password ? '••••••••' : null,
  };
}
