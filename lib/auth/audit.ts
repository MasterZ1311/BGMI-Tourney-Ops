/**
 * BGMI Tournament Control Center (TCC) — Audit Logging Service
 * Immutable logging of all sensitive state transitions and administrative overrides.
 */

import { db } from '../db';
import {
  AuditAction,
  AuditEntityType,
  CreateAuditLogParams,
  AuditLogFilterParams,
  AuditLogRecord,
  AuditDeltaSummary,
} from './types';

/**
 * Serialize state data into standardized JSON string or null.
 */
function serializeState(state: unknown): string | null {
  if (state === null || state === undefined) return null;
  if (typeof state === 'string') return state;
  try {
    return JSON.stringify(state);
  } catch (err) {
    return `[Unserializable state: ${String(err)}]`;
  }
}

/**
 * Core primitive to create an AuditLog entry.
 * Supports execution inside an existing Prisma interactive transaction via `params.tx`.
 */
export async function createAuditLog(
  params: CreateAuditLogParams
): Promise<AuditLogRecord> {
  const client = params.tx ?? db;

  const beforeSerialized = serializeState(params.beforeState);
  const afterSerialized = serializeState(params.afterState);

  const entry = await client.auditLog.create({
    data: {
      tournamentId: params.tournamentId ?? null,
      userId: params.userId ?? 'system',
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      beforeState: beforeSerialized,
      afterState: afterSerialized,
      reason: params.reason ?? null,
    },
  });

  return entry as AuditLogRecord;
}

/**
 * Query audit logs with structured filtering and pagination.
 */
export async function queryAuditLogs(
  filters: AuditLogFilterParams
): Promise<AuditLogRecord[]> {
  const where: Record<string, any> = {};

  if (filters.tournamentId) where.tournamentId = filters.tournamentId;
  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.entityId) where.entityId = filters.entityId;
  if (filters.action) where.action = filters.action;
  if (filters.userId) where.userId = filters.userId;

  const logs = await db.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters.take ?? 100,
    skip: filters.skip ?? 0,
  });

  return logs as AuditLogRecord[];
}

/**
 * Calculate field-level differences between beforeState and afterState.
 */
export function computeAuditDelta(
  before: unknown,
  after: unknown
): AuditDeltaSummary {
  const beforeObj: Record<string, any> =
    typeof before === 'string'
      ? safeJsonParse(before)
      : (before as Record<string, any>) || {};
  const afterObj: Record<string, any> =
    typeof after === 'string'
      ? safeJsonParse(after)
      : (after as Record<string, any>) || {};

  const allKeys = new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]);
  const changedKeys: string[] = [];
  const deltas: Record<string, { before: unknown; after: unknown }> = {};

  for (const key of allKeys) {
    const valBefore = beforeObj[key];
    const valAfter = afterObj[key];

    const isDifferent =
      JSON.stringify(valBefore) !== JSON.stringify(valAfter);

    if (isDifferent) {
      changedKeys.push(key);
      deltas[key] = { before: valBefore, after: valAfter };
    }
  }

  return { changedKeys, deltas };
}

function safeJsonParse(str: string): Record<string, any> {
  try {
    const parsed = JSON.parse(str);
    return typeof parsed === 'object' && parsed !== null ? parsed : { value: parsed };
  } catch {
    return { raw: str };
  }
}

// ---------------------------------------------------------------------------
// Specialized State Transition Loggers
// ---------------------------------------------------------------------------

/**
 * Log saving or updating match score sheets.
 */
export async function logScoreSaved(params: {
  tournamentId: string;
  matchId: string;
  userId?: string | null;
  resultStatus: string;
  teamCount: number;
  tx?: any;
}) {
  return createAuditLog({
    tournamentId: params.tournamentId,
    userId: params.userId,
    action: 'MATCH_SCORE_SAVED',
    entityType: 'Match',
    entityId: params.matchId,
    afterState: {
      resultStatus: params.resultStatus,
      scoresCount: params.teamCount,
    },
    reason: `Results saved with status ${params.resultStatus} for ${params.teamCount} teams.`,
    tx: params.tx,
  });
}

/**
 * Log score verification by tournament admin.
 */
export async function logScoreVerified(params: {
  tournamentId: string;
  matchId: string;
  userId?: string | null;
  teamCount: number;
  tx?: any;
}) {
  return createAuditLog({
    tournamentId: params.tournamentId,
    userId: params.userId,
    action: 'MATCH_SCORE_VERIFIED',
    entityType: 'Match',
    entityId: params.matchId,
    beforeState: { resultStatus: 'SUBMITTED' },
    afterState: { resultStatus: 'VERIFIED' },
    reason: `Match scores verified for ${params.teamCount} teams.`,
    tx: params.tx,
  });
}

/**
 * Log official publication of match results to leaderboard.
 */
export async function logScorePublished(params: {
  tournamentId: string;
  matchId: string;
  userId?: string | null;
  reason?: string;
  tx?: any;
}) {
  return createAuditLog({
    tournamentId: params.tournamentId,
    userId: params.userId,
    action: 'MATCH_SCORE_PUBLISHED',
    entityType: 'Match',
    entityId: params.matchId,
    beforeState: { resultStatus: 'VERIFIED' },
    afterState: { resultStatus: 'PUBLISHED', status: 'PUBLISHED' },
    reason: params.reason || 'Results published to official leaderboard and stream overlays.',
    tx: params.tx,
  });
}

/**
 * Log administrative score override on a PUBLISHED match result.
 */
export async function logScoreOverride(params: {
  tournamentId: string;
  matchId: string;
  userId: string;
  beforeScores: unknown;
  afterScores: unknown;
  reason: string;
  tx?: any;
}) {
  return createAuditLog({
    tournamentId: params.tournamentId,
    userId: params.userId,
    action: 'MATCH_SCORE_OVERRIDDEN',
    entityType: 'Match',
    entityId: params.matchId,
    beforeState: params.beforeScores,
    afterState: params.afterScores,
    reason: params.reason,
    tx: params.tx,
  });
}

/**
 * Log team penalty deduction.
 */
export async function logPenaltyIssued(params: {
  tournamentId: string;
  penaltyId: string;
  teamId: string;
  pointsDeducted: number;
  reason: string;
  userId: string;
  tx?: any;
}) {
  return createAuditLog({
    tournamentId: params.tournamentId,
    userId: params.userId,
    action: 'PENALTY_ISSUED',
    entityType: 'Penalty',
    entityId: params.penaltyId,
    afterState: {
      teamId: params.teamId,
      pointsDeducted: params.pointsDeducted,
      reason: params.reason,
      status: 'ACTIVE',
    },
    reason: `Deducted ${params.pointsDeducted} points from team ${params.teamId}: ${params.reason}`,
    tx: params.tx,
  });
}

/**
 * Log penalty voiding.
 */
export async function logPenaltyVoided(params: {
  tournamentId: string;
  penaltyId: string;
  teamId: string;
  reason: string;
  userId: string;
  tx?: any;
}) {
  return createAuditLog({
    tournamentId: params.tournamentId,
    userId: params.userId,
    action: 'PENALTY_VOIDED',
    entityType: 'Penalty',
    entityId: params.penaltyId,
    beforeState: { status: 'ACTIVE' },
    afterState: { status: 'VOIDED' },
    reason: `Penalty voided: ${params.reason}`,
    tx: params.tx,
  });
}

/**
 * Log tournament finalization lock.
 */
export async function logTournamentFinalization(params: {
  tournamentId: string;
  userId: string;
  summary?: unknown;
  tx?: any;
}) {
  return createAuditLog({
    tournamentId: params.tournamentId,
    userId: params.userId,
    action: 'TOURNAMENT_FINALIZED',
    entityType: 'Tournament',
    entityId: params.tournamentId,
    beforeState: { isFinalized: false, status: 'RESULTS_REVIEW' },
    afterState: {
      isFinalized: true,
      status: 'COMPLETED',
      summary: params.summary,
    },
    reason: 'Tournament pre-flight audit passed and official results locked.',
    tx: params.tx,
  });
}

/**
 * Log group lock / unlock mutation.
 */
export async function logGroupLock(params: {
  tournamentId: string;
  groupId: string;
  isLocked: boolean;
  userId?: string | null;
  tx?: any;
}) {
  return createAuditLog({
    tournamentId: params.tournamentId,
    userId: params.userId,
    action: params.isLocked ? 'GROUP_LOCKED' : 'GROUP_UNLOCKED',
    entityType: 'Group',
    entityId: params.groupId,
    beforeState: { isLocked: !params.isLocked },
    afterState: { isLocked: params.isLocked },
    reason: `Group ${params.groupId} roster ${params.isLocked ? 'locked against changes' : 'unlocked'}.`,
    tx: params.tx,
  });
}

/**
 * Log dispute ticket adjudication.
 */
export async function logDisputeResolution(params: {
  tournamentId: string;
  disputeId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'RESOLVED';
  resolutionNotes?: string | null;
  userId: string;
  tx?: any;
}) {
  return createAuditLog({
    tournamentId: params.tournamentId,
    userId: params.userId,
    action: 'DISPUTE_ADJUDICATED',
    entityType: 'Dispute',
    entityId: params.disputeId,
    afterState: {
      status: params.status,
      resolutionNotes: params.resolutionNotes,
      resolvedBy: params.userId,
    },
    reason: `Dispute ${params.status}: ${params.resolutionNotes || 'No notes provided'}`,
    tx: params.tx,
  });
}

/**
 * Log room credential changes.
 */
export async function logRoomCredentialsUpdated(params: {
  tournamentId: string;
  matchId: string;
  roomId?: string | null;
  hasPassword: boolean;
  status?: string;
  userId?: string | null;
  tx?: any;
}) {
  return createAuditLog({
    tournamentId: params.tournamentId,
    userId: params.userId,
    action: 'ROOM_CREDENTIALS_UPDATED',
    entityType: 'Room',
    entityId: params.matchId,
    afterState: {
      roomId: params.roomId,
      passwordConfigured: params.hasPassword,
      status: params.status,
    },
    reason: `Lobby room credentials updated (ID: ${params.roomId || 'none'}, Password: ${params.hasPassword ? 'configured' : 'none'}).`,
    tx: params.tx,
  });
}
