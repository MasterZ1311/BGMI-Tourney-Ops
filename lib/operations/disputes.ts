/**
 * BGMI Tournament Control Center — Dispute & Protest Desk Service
 * Manages squad protests, rule disputes, evidence tracking, and adjudication lifecycles.
 */

import {
  AdjudicateDisputeInput,
  CreateDisputeInput,
  DisputeCategory,
  DisputeRecord,
  DisputeStatus,
} from './types';
import { domainEventBus } from './events';

export const VALID_DISPUTE_CATEGORIES: DisputeCategory[] = [
  'SCORING',
  'ROSTER',
  'BEHAVIOR',
  'TECHNICAL',
];

/**
 * Validate dispute creation parameters.
 */
export function validateDisputeInput(input: CreateDisputeInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!input.teamId || input.teamId.trim().length === 0) {
    errors.push('Filing Team ID is required.');
  }

  if (!input.category || !VALID_DISPUTE_CATEGORIES.includes(input.category)) {
    errors.push(`Dispute category must be one of: [${VALID_DISPUTE_CATEGORIES.join(', ')}].`);
  }

  if (!input.description || input.description.trim().length < 5) {
    errors.push('Dispute description must be at least 5 characters detailing the protest.');
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
 * File a new protest or dispute ticket.
 */
export function createDisputeRecord(
  input: CreateDisputeInput
): { success: boolean; record?: DisputeRecord; errors?: string[] } {
  const validation = validateDisputeInput(input);
  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors,
    };
  }

  const record: DisputeRecord = {
    id: `disp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    tournamentId: input.tournamentId,
    teamId: input.teamId,
    matchId: input.matchId ?? null,
    category: input.category,
    description: input.description.trim(),
    evidenceUrl: input.evidenceUrl?.trim() ?? null,
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  };

  domainEventBus.emit(
    'dispute.created',
    'DISPUTE',
    record.id,
    {
      tournamentId: record.tournamentId,
      teamId: record.teamId,
      matchId: record.matchId,
      category: record.category,
      status: 'OPEN',
    },
    null
  );

  return {
    success: true,
    record,
  };
}

/**
 * Adjudicate a dispute ticket (REVIEW, ACCEPT, REJECT, or RESOLVE).
 */
export function adjudicateDispute(
  dispute: DisputeRecord,
  input: AdjudicateDisputeInput
): { success: boolean; record?: DisputeRecord; error?: string } {
  if (!input.resolutionNotes || input.resolutionNotes.trim().length < 3) {
    return {
      success: false,
      error: 'Resolution notes (min 3 characters) are required when adjudicating a dispute.',
    };
  }

  let nextStatus: DisputeStatus;
  switch (input.action) {
    case 'REVIEW':
      nextStatus = 'UNDER_REVIEW';
      break;
    case 'ACCEPT':
      nextStatus = 'ACCEPTED';
      break;
    case 'REJECT':
      nextStatus = 'REJECTED';
      break;
    case 'RESOLVE':
      nextStatus = 'RESOLVED';
      break;
    default:
      return {
        success: false,
        error: `Unknown adjudication action: ${input.action}`,
      };
  }

  const updated: DisputeRecord = {
    ...dispute,
    status: nextStatus,
    resolutionNotes: input.resolutionNotes.trim(),
    resolvedBy: input.resolvedBy,
    updatedAt: new Date().toISOString(),
  };

  const isTerminal = nextStatus === 'RESOLVED' || nextStatus === 'ACCEPTED' || nextStatus === 'REJECTED';

  if (isTerminal) {
    domainEventBus.emit(
      'dispute.resolved',
      'DISPUTE',
      dispute.id,
      {
        tournamentId: dispute.tournamentId,
        teamId: dispute.teamId,
        matchId: dispute.matchId,
        status: nextStatus,
        resolutionNotes: updated.resolutionNotes,
      },
      input.resolvedBy
    );
  } else {
    domainEventBus.emit(
      'dispute.status_updated',
      'DISPUTE',
      dispute.id,
      {
        tournamentId: dispute.tournamentId,
        teamId: dispute.teamId,
        status: nextStatus,
      },
      input.resolvedBy
    );
  }

  return {
    success: true,
    record: updated,
  };
}

/**
 * Retrieve blocking (unresolved) disputes for a specific match or tournament.
 */
export function getOpenDisputesForMatch(
  disputes: DisputeRecord[],
  matchId: string
): DisputeRecord[] {
  return disputes.filter(
    (d) => d.matchId === matchId && (d.status === 'OPEN' || d.status === 'UNDER_REVIEW')
  );
}

/**
 * Count total blocking open disputes across a tournament or match.
 */
export function countBlockingDisputes(
  disputes: DisputeRecord[],
  matchId?: string
): number {
  return disputes.filter((d) => {
    const matchesMatch = !matchId || d.matchId === matchId;
    const isOpen = d.status === 'OPEN' || d.status === 'UNDER_REVIEW';
    return matchesMatch && isOpen;
  }).length;
}
