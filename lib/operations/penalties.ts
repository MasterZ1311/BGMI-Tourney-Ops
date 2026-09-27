/**
 * BGMI Tournament Control Center — Penalty Management Service
 * Manages competitive point deductions, rule violation penalties, and penalty voiding.
 */

import {
  CreatePenaltyInput,
  PenaltyRecord,
} from './types';
import { domainEventBus } from './events';

/**
 * Validate penalty creation parameters.
 */
export function validatePenaltyInput(input: CreatePenaltyInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!input.teamId || input.teamId.trim().length === 0) {
    errors.push('Target Team ID is required.');
  }

  if (input.pointsDeducted <= 0) {
    errors.push('Points deducted must be a positive number greater than 0.');
  }

  if (!input.reason || input.reason.trim().length < 3) {
    errors.push('A valid penalty reason (min 3 characters) is required.');
  }

  if (input.evidenceUrl) {
    try {
      new URL(input.evidenceUrl);
    } catch {
      errors.push('Evidence URL must be a valid URL.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create a new penalty deduction record and emit operational event.
 */
export function createPenaltyRecord(
  input: CreatePenaltyInput
): { success: boolean; record?: PenaltyRecord; errors?: string[] } {
  const validation = validatePenaltyInput(input);
  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors,
    };
  }

  const record: PenaltyRecord = {
    id: `pen_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    tournamentId: input.tournamentId,
    teamId: input.teamId,
    matchId: input.matchId ?? null,
    pointsDeducted: input.pointsDeducted,
    reason: input.reason.trim(),
    evidenceUrl: input.evidenceUrl?.trim() ?? null,
    status: 'ACTIVE',
    issuedBy: input.issuedBy,
    createdAt: new Date().toISOString(),
  };

  domainEventBus.emit(
    'penalty.issued',
    'PENALTY',
    record.id,
    {
      tournamentId: record.tournamentId,
      teamId: record.teamId,
      matchId: record.matchId,
      pointsDeducted: record.pointsDeducted,
      reason: record.reason,
    },
    input.issuedBy
  );

  return {
    success: true,
    record,
  };
}

/**
 * Void an existing penalty deduction with mandatory audit reason.
 */
export function voidPenaltyRecord(
  penalty: PenaltyRecord,
  voidReason: string,
  voidedBy: string
): { success: boolean; record?: PenaltyRecord; error?: string } {
  if (penalty.status === 'VOIDED') {
    return {
      success: false,
      error: 'Penalty is already VOIDED.',
    };
  }

  if (!voidReason || voidReason.trim().length < 3) {
    return {
      success: false,
      error: 'A valid reason for voiding the penalty is required (min 3 characters).',
    };
  }

  const updated: PenaltyRecord = {
    ...penalty,
    status: 'VOIDED',
    voidReason: voidReason.trim(),
    voidedBy,
    updatedAt: new Date().toISOString(),
  };

  domainEventBus.emit(
    'penalty.voided',
    'PENALTY',
    penalty.id,
    {
      tournamentId: penalty.tournamentId,
      teamId: penalty.teamId,
      pointsDeducted: penalty.pointsDeducted,
      voidReason,
    },
    voidedBy
  );

  return {
    success: true,
    record: updated,
  };
}

/**
 * Calculate net active penalty points deducted for a specific team.
 */
export function calculateNetTeamPenalties(
  penalties: PenaltyRecord[],
  teamId: string
): number {
  return penalties
    .filter((p) => p.teamId === teamId && p.status === 'ACTIVE')
    .reduce((sum, p) => sum + p.pointsDeducted, 0);
}
