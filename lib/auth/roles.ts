export type Role =
  | 'SUPER_ADMIN'
  | 'TOURNAMENT_ADMIN'
  | 'MATCH_ADMIN'
  | 'SCOREKEEPER'
  | 'OBSERVER';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export const ROLE_PERMISSIONS: Record<Role, {
  canManageTournaments: boolean;
  canManageTeams: boolean;
  canManageRooms: boolean;
  canEditScores: boolean;
  canVerifyScores: boolean;
  canIssuePenalties: boolean;
  canFinalizeTournament: boolean;
  canViewAuditLogs: boolean;
  canSeeRoomPasswords: boolean;
}> = {
  SUPER_ADMIN: {
    canManageTournaments: true,
    canManageTeams: true,
    canManageRooms: true,
    canEditScores: true,
    canVerifyScores: true,
    canIssuePenalties: true,
    canFinalizeTournament: true,
    canViewAuditLogs: true,
    canSeeRoomPasswords: true,
  },
  TOURNAMENT_ADMIN: {
    canManageTournaments: true,
    canManageTeams: true,
    canManageRooms: true,
    canEditScores: true,
    canVerifyScores: true,
    canIssuePenalties: true,
    canFinalizeTournament: true,
    canViewAuditLogs: true,
    canSeeRoomPasswords: true,
  },
  MATCH_ADMIN: {
    canManageTournaments: false,
    canManageTeams: true,
    canManageRooms: true,
    canEditScores: true,
    canVerifyScores: false,
    canIssuePenalties: false,
    canFinalizeTournament: false,
    canViewAuditLogs: false,
    canSeeRoomPasswords: true,
  },
  SCOREKEEPER: {
    canManageTournaments: false,
    canManageTeams: false,
    canManageRooms: false,
    canEditScores: true,
    canVerifyScores: false,
    canIssuePenalties: false,
    canFinalizeTournament: false,
    canViewAuditLogs: false,
    canSeeRoomPasswords: false,
  },
  OBSERVER: {
    canManageTournaments: false,
    canManageTeams: false,
    canManageRooms: false,
    canEditScores: false,
    canVerifyScores: false,
    canIssuePenalties: false,
    canFinalizeTournament: false,
    canViewAuditLogs: false,
    canSeeRoomPasswords: false,
  },
};

export const DEFAULT_DEV_USER: UserSession = {
  id: 'usr_organizer_superadmin',
  name: 'Tournament Director',
  email: 'director@bgmi-tcc.esports',
  role: 'SUPER_ADMIN',
};

export function checkPermission(role: Role, permission: keyof typeof ROLE_PERMISSIONS['SUPER_ADMIN']): boolean {
  return !!ROLE_PERMISSIONS[role]?.[permission];
}
