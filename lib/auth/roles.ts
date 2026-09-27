/**
 * BGMI Tournament Control Center (TCC) — Role-Based Access Control (RBAC)
 * Authoritative permission matrices, role hierarchies, and permission guard helpers.
 */

import {
  Role,
  UserSession,
  PermissionDefinition,
  PermissionKey,
} from './types';

export type { Role, UserSession, PermissionDefinition, PermissionKey };

/**
 * Numeric role hierarchy weights.
 * Higher number denotes higher operational privilege.
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  SUPER_ADMIN: 100,
  TOURNAMENT_ADMIN: 80,
  MATCH_ADMIN: 60,
  SCOREKEEPER: 40,
  OBSERVER: 20,
};

/**
 * Authoritative platform permissions per operational role.
 */
export const ROLE_PERMISSIONS: Record<Role, PermissionDefinition> = {
  SUPER_ADMIN: {
    canManageTournaments: true,
    canManageTeams: true,
    canManageGroups: true,
    canManageMatches: true,
    canManageRooms: true,
    canSeeRoomPasswords: true,
    canChangeMatchState: true,
    canManageAttendance: true,
    canEditScores: true,
    canVerifyScores: true,
    canPublishScores: true,
    canOverridePublishedScores: true,
    canIssuePenalties: true,
    canVoidPenalties: true,
    canCreateDisputes: true,
    canAdjudicateDisputes: true,
    canFinalizeTournament: true,
    canViewAuditLogs: true,
    canViewPlayerPII: true,
    canViewPublicLeaderboard: true,
  },
  TOURNAMENT_ADMIN: {
    canManageTournaments: true,
    canManageTeams: true,
    canManageGroups: true,
    canManageMatches: true,
    canManageRooms: true,
    canSeeRoomPasswords: true,
    canChangeMatchState: true,
    canManageAttendance: true,
    canEditScores: true,
    canVerifyScores: true,
    canPublishScores: true,
    canOverridePublishedScores: true,
    canIssuePenalties: true,
    canVoidPenalties: true,
    canCreateDisputes: true,
    canAdjudicateDisputes: true,
    canFinalizeTournament: true,
    canViewAuditLogs: true,
    canViewPlayerPII: true,
    canViewPublicLeaderboard: true,
  },
  MATCH_ADMIN: {
    canManageTournaments: false,
    canManageTeams: true,
    canManageGroups: false,
    canManageMatches: false,
    canManageRooms: true,
    canSeeRoomPasswords: true,
    canChangeMatchState: true,
    canManageAttendance: true,
    canEditScores: true,
    canVerifyScores: false,
    canPublishScores: false,
    canOverridePublishedScores: false,
    canIssuePenalties: false,
    canVoidPenalties: false,
    canCreateDisputes: true,
    canAdjudicateDisputes: false,
    canFinalizeTournament: false,
    canViewAuditLogs: false,
    canViewPlayerPII: true,
    canViewPublicLeaderboard: true,
  },
  SCOREKEEPER: {
    canManageTournaments: false,
    canManageTeams: false,
    canManageGroups: false,
    canManageMatches: false,
    canManageRooms: false,
    canSeeRoomPasswords: false,
    canChangeMatchState: false,
    canManageAttendance: false,
    canEditScores: true,
    canVerifyScores: false,
    canPublishScores: false,
    canOverridePublishedScores: false,
    canIssuePenalties: false,
    canVoidPenalties: false,
    canCreateDisputes: false,
    canAdjudicateDisputes: false,
    canFinalizeTournament: false,
    canViewAuditLogs: false,
    canViewPlayerPII: false,
    canViewPublicLeaderboard: true,
  },
  OBSERVER: {
    canManageTournaments: false,
    canManageTeams: false,
    canManageGroups: false,
    canManageMatches: false,
    canManageRooms: false,
    canSeeRoomPasswords: false,
    canChangeMatchState: false,
    canManageAttendance: false,
    canEditScores: false,
    canVerifyScores: false,
    canPublishScores: false,
    canOverridePublishedScores: false,
    canIssuePenalties: false,
    canVoidPenalties: false,
    canCreateDisputes: false,
    canAdjudicateDisputes: false,
    canFinalizeTournament: false,
    canViewAuditLogs: false,
    canViewPlayerPII: false,
    canViewPublicLeaderboard: true,
  },
};

/**
 * Standard development / fallback user sessions.
 */
export const DEFAULT_DEV_USER: UserSession = {
  id: 'usr_organizer_superadmin',
  name: 'Tournament Director',
  email: 'director@bgmi-tcc.esports',
  role: 'SUPER_ADMIN',
};

export const MOCK_USERS: Record<Role, UserSession> = {
  SUPER_ADMIN: {
    id: 'usr_super_admin',
    name: 'Tournament Director',
    email: 'director@bgmi-tcc.esports',
    role: 'SUPER_ADMIN',
  },
  TOURNAMENT_ADMIN: {
    id: 'usr_tournament_admin',
    name: 'Head Tournament Admin',
    email: 'headadmin@bgmi-tcc.esports',
    role: 'TOURNAMENT_ADMIN',
  },
  MATCH_ADMIN: {
    id: 'usr_match_admin',
    name: 'Lobby Marshal',
    email: 'marshal@bgmi-tcc.esports',
    role: 'MATCH_ADMIN',
  },
  SCOREKEEPER: {
    id: 'usr_scorekeeper',
    name: 'Official Scorekeeper',
    email: 'scorekeeper@bgmi-tcc.esports',
    role: 'SCOREKEEPER',
  },
  OBSERVER: {
    id: 'usr_observer',
    name: 'Broadcast Observer',
    email: 'observer@bgmi-tcc.esports',
    role: 'OBSERVER',
  },
};

/**
 * Check if a role possesses a specific permission.
 */
export function checkPermission(role: Role, permission: PermissionKey): boolean {
  return !!ROLE_PERMISSIONS[role]?.[permission];
}

/**
 * Check if a user session possesses a specific permission.
 */
export function userHasPermission(user: UserSession | null | undefined, permission: PermissionKey): boolean {
  if (!user || !user.role) return false;
  return checkPermission(user.role, permission);
}

/**
 * Check if a role meets or exceeds a target minimum role in hierarchy.
 */
export function isRoleAtLeast(userRole: Role, minimumRole: Role): boolean {
  const userRank = ROLE_HIERARCHY[userRole] ?? 0;
  const targetRank = ROLE_HIERARCHY[minimumRole] ?? 0;
  return userRank >= targetRank;
}

/**
 * Check if a user session has any of the specified permissions.
 */
export function hasAnyPermission(role: Role, permissions: PermissionKey[]): boolean {
  return permissions.some((perm) => checkPermission(role, perm));
}

/**
 * Check if a role has all specified permissions.
 */
export function hasAllPermissions(role: Role, permissions: PermissionKey[]): boolean {
  return permissions.every((perm) => checkPermission(role, perm));
}

/**
 * Retrieve the full permission dictionary for a given role.
 */
export function getPermissionsForRole(role: Role): PermissionDefinition {
  return ROLE_PERMISSIONS[role];
}

/**
 * Validate whether a string is a recognized platform Role.
 */
export function isValidRole(role: string): role is Role {
  return role in ROLE_PERMISSIONS;
}

/**
 * Returns all available role names.
 */
export function getAllRoles(): Role[] {
  return Object.keys(ROLE_PERMISSIONS) as Role[];
}
