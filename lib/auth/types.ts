/**
 * BGMI Tournament Control Center (TCC) — Security & RBAC Types
 * Single source of truth for platform security, access control, audit, and credential masking.
 */

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

export interface PermissionDefinition {
  canManageTournaments: boolean;
  canManageTeams: boolean;
  canManageGroups: boolean;
  canManageMatches: boolean;
  canManageRooms: boolean;
  canSeeRoomPasswords: boolean;
  canChangeMatchState: boolean;
  canManageAttendance: boolean;
  canEditScores: boolean;
  canVerifyScores: boolean;
  canPublishScores: boolean;
  canOverridePublishedScores: boolean;
  canIssuePenalties: boolean;
  canVoidPenalties: boolean;
  canCreateDisputes: boolean;
  canAdjudicateDisputes: boolean;
  canFinalizeTournament: boolean;
  canViewAuditLogs: boolean;
  canViewPlayerPII: boolean;
  canViewPublicLeaderboard: boolean;
}

export type PermissionKey = keyof PermissionDefinition;

export type AuditAction =
  | 'MATCH_SCORE_SAVED'
  | 'MATCH_SCORE_SUBMITTED'
  | 'MATCH_SCORE_VERIFIED'
  | 'MATCH_SCORE_PUBLISHED'
  | 'MATCH_SCORE_OVERRIDDEN'
  | 'PENALTY_ISSUED'
  | 'PENALTY_VOIDED'
  | 'DISPUTE_CREATED'
  | 'DISPUTE_ADJUDICATED'
  | 'GROUP_LOCKED'
  | 'GROUP_UNLOCKED'
  | 'GROUPS_RANDOMIZED'
  | 'TOURNAMENT_CREATED'
  | 'TOURNAMENT_UPDATED'
  | 'TOURNAMENT_FINALIZED'
  | 'ROOM_CREDENTIALS_UPDATED'
  | 'TEAM_REGISTERED'
  | 'TEAM_VERIFIED'
  | 'TEAM_DISQUALIFIED'
  | 'TEAM_REINSTATED'
  | 'SETTINGS_UPDATED';

export type AuditEntityType =
  | 'Match'
  | 'Tournament'
  | 'Team'
  | 'Group'
  | 'Penalty'
  | 'Dispute'
  | 'Room'
  | 'TournamentSettings'
  | 'User'
  | string;

export interface AuditLogRecord {
  id: string;
  tournamentId?: string | null;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeState?: string | null;
  afterState?: string | null;
  reason?: string | null;
  createdAt: Date;
}

export interface CreateAuditLogParams {
  tournamentId?: string | null;
  userId?: string | null;
  action: AuditAction | string;
  entityType: AuditEntityType;
  entityId: string;
  beforeState?: unknown;
  afterState?: unknown;
  reason?: string | null;
  tx?: any; // Prisma transaction client or db
}

export interface AuditLogFilterParams {
  tournamentId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  userId?: string;
  take?: number;
  skip?: number;
}

export interface AuditDeltaSummary {
  changedKeys: string[];
  deltas: Record<string, { before: unknown; after: unknown }>;
}
