/**
 * BGMI Tournament Control Center — Result Verification Workflow Service
 * Implements the 4-tier verification pipeline:
 * DRAFT ➔ SUBMITTED ➔ VERIFIED ➔ PUBLISHED,
 * Published Immutability Lock, Rejections, and Administrative Overrides.
 */

import {
  MatchEntity,
  PublishedScoreOverrideInput,
  ResultLifecycleStatus,
  ResultVerificationAudit,
  ScoreValidationIssue,
  TeamScoreEntryInput,
} from './types';
import { domainEventBus } from './events';

export class PublishedResultLockedError extends Error {
  readonly code = 'PUBLISHED_LOCKED';
  constructor(message = 'Scores for this match are PUBLISHED and locked against direct edits.') {
    super(message);
    this.name = 'PublishedResultLockedError';
  }
}

/**
 * Valid transitions for Result Lifecycle:
 * DRAFT ➔ SUBMITTED ➔ VERIFIED ➔ PUBLISHED
 */
const VALID_RESULT_TRANSITIONS: Record<ResultLifecycleStatus, ResultLifecycleStatus[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['VERIFIED', 'DRAFT'], // DRAFT on rejection / correction request
  VERIFIED: ['PUBLISHED', 'DRAFT'],  // DRAFT on rejection
  PUBLISHED: ['DRAFT', 'VERIFIED'],  // ONLY allowed via administrative override
};

/**
 * Validate result lifecycle transitions.
 */
export function validateResultTransition(
  currentStatus: ResultLifecycleStatus,
  nextStatus: ResultLifecycleStatus,
  isAdministrativeOverride = false
): { valid: boolean; reason?: string } {
  if (currentStatus === nextStatus) {
    return { valid: true };
  }

  if (currentStatus === 'PUBLISHED' && !isAdministrativeOverride) {
    return {
      valid: false,
      reason: 'Match result is PUBLISHED. Direct modification is prohibited without administrative override.',
    };
  }

  const allowed = VALID_RESULT_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    return {
      valid: false,
      reason: `Illegal result transition from ${currentStatus} to ${nextStatus}. Allowed: [${allowed.join(', ')}]`,
    };
  }

  return { valid: true };
}

/**
 * Assert that a match result is mutable. Throws PublishedResultLockedError if locked.
 */
export function assertResultMutable(
  resultStatus: ResultLifecycleStatus,
  allowAdministrativeOverride = false
): void {
  if (resultStatus === 'PUBLISHED' && !allowAdministrativeOverride) {
    throw new PublishedResultLockedError();
  }
}

/**
 * Thorough audit of score sheet inputs before submission, verification, or publication:
 * - Checks continuous placement sequence (1 to N without duplicates or gaps)
 * - Checks exactly one #1 (WWCD)
 * - Checks non-negative kills
 * - Checks slotted team coverage
 * - Checks blocking open disputes
 */
export function auditScoreSheet(
  matchId: string,
  scores: TeamScoreEntryInput[],
  options?: {
    currentStatus?: ResultLifecycleStatus;
    expectedTeamCount?: number;
    slottedTeamIds?: string[];
    openDisputesCount?: number;
  }
): ResultVerificationAudit {
  const issues: ScoreValidationIssue[] = [];
  const expectedCount = options?.expectedTeamCount ?? scores.length;
  const slottedIds = options?.slottedTeamIds ? new Set(options.slottedTeamIds) : null;
  const openDisputes = options?.openDisputesCount ?? 0;

  if (scores.length === 0) {
    issues.push({
      message: 'Score sheet contains zero team records.',
      severity: 'ERROR',
    });
  }

  const placements = new Set<number>();
  let duplicatePlacements = false;
  let negativeKills = false;
  let wwcdCount = 0;

  for (const s of scores) {
    // Placement check
    if (s.placement < 1) {
      issues.push({
        teamId: s.teamId,
        field: 'placement',
        message: `Invalid placement rank #${s.placement}. Must be >= 1.`,
        severity: 'ERROR',
      });
    }

    if (placements.has(s.placement)) {
      duplicatePlacements = true;
      issues.push({
        teamId: s.teamId,
        field: 'placement',
        message: `Duplicate placement rank #${s.placement} detected.`,
        severity: 'ERROR',
      });
    }
    placements.add(s.placement);

    if (s.placement === 1) {
      wwcdCount++;
    }

    // Kill count check
    if (s.kills < 0) {
      negativeKills = true;
      issues.push({
        teamId: s.teamId,
        field: 'kills',
        message: `Negative kill count (${s.kills}) for team ${s.teamId}.`,
        severity: 'ERROR',
      });
    }

    // Check against slotted teams
    if (slottedIds && !slottedIds.has(s.teamId)) {
      issues.push({
        teamId: s.teamId,
        message: `Team ${s.teamId} was not slotted for this match.`,
        severity: 'WARNING',
      });
    }
  }

  // Sequence completeness check (ranks 1 through N should all exist)
  let continuousSequence = true;
  for (let rank = 1; rank <= scores.length; rank++) {
    if (!placements.has(rank)) {
      continuousSequence = false;
      issues.push({
        field: 'placement',
        message: `Missing placement rank #${rank} in sequence 1..${scores.length}.`,
        severity: 'ERROR',
      });
      break;
    }
  }

  const wwcdValid = wwcdCount === 1;
  if (scores.length > 0 && wwcdCount !== 1) {
    issues.push({
      field: 'placement',
      message: `Match must have exactly one WWCD (rank #1), but found ${wwcdCount}.`,
      severity: 'ERROR',
    });
  }

  // Slotted teams coverage check
  let allSlottedReported = true;
  if (slottedIds) {
    for (const teamId of Array.from(slottedIds)) {
      if (!scores.some((s) => s.teamId === teamId)) {
        allSlottedReported = false;
        issues.push({
          teamId,
          message: `Slotted team ${teamId} is missing from the score sheet.`,
          severity: 'ERROR',
        });
      }
    }
  }

  // Dispute check
  if (openDisputes > 0) {
    issues.push({
      message: `There are ${openDisputes} unresolved dispute(s) filed for this match.`,
      severity: 'WARNING',
    });
  }

  const hasErrors = issues.some((i) => i.severity === 'ERROR');

  return {
    matchId,
    currentLifecycleStatus: options?.currentStatus ?? 'DRAFT',
    isValid: !hasErrors,
    issues,
    placementSequenceValid: continuousSequence && !duplicatePlacements,
    wwcdCountValid: wwcdValid,
    killCountsValid: !negativeKills,
    allSlottedTeamsReported: allSlottedReported,
    hasOpenDisputes: openDisputes > 0,
    openDisputeCount: openDisputes,
  };
}

// ---------------------------------------------------------------------------
// 4-Tier Result Operations Pipeline
// ---------------------------------------------------------------------------

/**
 * Tier 1 ➔ Tier 2: SUBMIT MATCH RESULT (DRAFT ➔ SUBMITTED)
 * Scorekeeper submits entered scores for head admin verification.
 */
export function submitMatchResult(
  match: MatchEntity,
  scores: TeamScoreEntryInput[],
  options?: {
    operatorUserId?: string;
    expectedTeamCount?: number;
    slottedTeamIds?: string[];
  }
): {
  success: boolean;
  match: MatchEntity;
  audit: ResultVerificationAudit;
  message?: string;
} {
  assertResultMutable(match.resultStatus);

  const transitionCheck = validateResultTransition(match.resultStatus, 'SUBMITTED');
  if (!transitionCheck.valid) {
    const audit = auditScoreSheet(match.id, scores, { currentStatus: match.resultStatus });
    return {
      success: false,
      match,
      audit,
      message: transitionCheck.reason,
    };
  }

  const audit = auditScoreSheet(match.id, scores, {
    currentStatus: match.resultStatus,
    expectedTeamCount: options?.expectedTeamCount,
    slottedTeamIds: options?.slottedTeamIds,
  });

  if (!audit.isValid) {
    return {
      success: false,
      match,
      audit,
      message: `Score sheet audit failed: ${audit.issues.filter((i) => i.severity === 'ERROR').map((i) => i.message).join(' ')}`,
    };
  }

  const updatedMatch: MatchEntity = {
    ...match,
    resultStatus: 'SUBMITTED',
  };

  domainEventBus.emit(
    'result.submitted',
    'RESULT',
    match.id,
    {
      matchNumber: match.matchNumber,
      scoresCount: scores.length,
      resultStatus: 'SUBMITTED',
    },
    options?.operatorUserId
  );

  return {
    success: true,
    match: updatedMatch,
    audit,
    message: `Scores for Match #${match.matchNumber} submitted for head admin review.`,
  };
}

/**
 * REJECT RESULT (SUBMITTED / VERIFIED ➔ DRAFT)
 * Head admin rejects score entry back to DRAFT with a mandatory reason.
 */
export function rejectResult(
  match: MatchEntity,
  reason: string,
  options?: { operatorUserId?: string }
): { success: boolean; match: MatchEntity; message?: string } {
  assertResultMutable(match.resultStatus);

  if (!reason || reason.trim().length === 0) {
    return {
      success: false,
      match,
      message: 'Rejection reason is required.',
    };
  }

  const updatedMatch: MatchEntity = {
    ...match,
    resultStatus: 'DRAFT',
  };

  domainEventBus.emit(
    'result.rejected',
    'RESULT',
    match.id,
    {
      matchNumber: match.matchNumber,
      previousStatus: match.resultStatus,
      resultStatus: 'DRAFT',
      reason,
    },
    options?.operatorUserId
  );

  return {
    success: true,
    match: updatedMatch,
    message: `Result rejected back to DRAFT: ${reason}`,
  };
}

/**
 * REQUEST CORRECTION (SUBMITTED ➔ DRAFT)
 * Head admin flags specific cells or notes needing correction by scorekeeper.
 */
export function requestCorrection(
  match: MatchEntity,
  notes: string,
  options?: { operatorUserId?: string }
): { success: boolean; match: MatchEntity; message?: string } {
  assertResultMutable(match.resultStatus);

  const updatedMatch: MatchEntity = {
    ...match,
    resultStatus: 'DRAFT',
  };

  domainEventBus.emit(
    'result.correction_requested',
    'RESULT',
    match.id,
    {
      matchNumber: match.matchNumber,
      notes,
      resultStatus: 'DRAFT',
    },
    options?.operatorUserId
  );

  return {
    success: true,
    match: updatedMatch,
    message: `Correction requested for Match #${match.matchNumber}: ${notes}`,
  };
}

/**
 * Tier 2 ➔ Tier 3: VERIFY MATCH RESULT (SUBMITTED ➔ VERIFIED)
 * Head admin confirms scores match in-game screenshot evidence.
 */
export function verifyMatchResult(
  match: MatchEntity,
  scores: TeamScoreEntryInput[],
  options?: {
    operatorUserId?: string;
    operatorRole?: string;
    expectedTeamCount?: number;
    slottedTeamIds?: string[];
  }
): {
  success: boolean;
  match: MatchEntity;
  audit: ResultVerificationAudit;
  message?: string;
} {
  assertResultMutable(match.resultStatus);

  const transitionCheck = validateResultTransition(match.resultStatus, 'VERIFIED');
  if (!transitionCheck.valid) {
    const audit = auditScoreSheet(match.id, scores, { currentStatus: match.resultStatus });
    return {
      success: false,
      match,
      audit,
      message: transitionCheck.reason,
    };
  }

  const audit = auditScoreSheet(match.id, scores, {
    currentStatus: match.resultStatus,
    expectedTeamCount: options?.expectedTeamCount,
    slottedTeamIds: options?.slottedTeamIds,
  });

  if (!audit.isValid) {
    return {
      success: false,
      match,
      audit,
      message: `Cannot verify invalid score sheet: ${audit.issues.map((i) => i.message).join(' ')}`,
    };
  }

  const updatedMatch: MatchEntity = {
    ...match,
    status: 'VERIFIED',
    resultStatus: 'VERIFIED',
  };

  domainEventBus.emit(
    'result.verified',
    'RESULT',
    match.id,
    {
      matchNumber: match.matchNumber,
      scoresCount: scores.length,
      resultStatus: 'VERIFIED',
    },
    options?.operatorUserId
  );

  return {
    success: true,
    match: updatedMatch,
    audit,
    message: `Match #${match.matchNumber} scores officially VERIFIED.`,
  };
}

/**
 * Tier 3 ➔ Tier 4: PUBLISH MATCH RESULT (VERIFIED ➔ PUBLISHED)
 * Publishes verified score sheet to tournament leaderboard.
 * Enforces Published Lock: scores become immutable after publication.
 */
export function publishMatchResult(
  match: MatchEntity,
  scores: TeamScoreEntryInput[],
  options?: {
    operatorUserId?: string;
    operatorRole?: string;
    openDisputesCount?: number;
  }
): {
  success: boolean;
  match: MatchEntity;
  audit: ResultVerificationAudit;
  message?: string;
} {
  const transitionCheck = validateResultTransition(match.resultStatus, 'PUBLISHED');
  if (!transitionCheck.valid) {
    const audit = auditScoreSheet(match.id, scores, { currentStatus: match.resultStatus });
    return {
      success: false,
      match,
      audit,
      message: transitionCheck.reason,
    };
  }

  const openDisputes = options?.openDisputesCount ?? 0;
  const audit = auditScoreSheet(match.id, scores, {
    currentStatus: match.resultStatus,
    openDisputesCount: openDisputes,
  });

  if (!audit.isValid) {
    return {
      success: false,
      match,
      audit,
      message: `Cannot publish score sheet: verification audit failed.`,
    };
  }

  // Warning or blocker on open disputes
  if (openDisputes > 0) {
    return {
      success: false,
      match,
      audit,
      message: `Cannot publish: Match #${match.matchNumber} has ${openDisputes} unresolved protest(s). Adjudicate all disputes first.`,
    };
  }

  const wwcdScore = scores.find((s) => s.placement === 1);
  const updatedMatch: MatchEntity = {
    ...match,
    status: 'PUBLISHED',
    resultStatus: 'PUBLISHED',
  };

  domainEventBus.emit(
    'result.published',
    'RESULT',
    match.id,
    {
      matchNumber: match.matchNumber,
      wwcdTeamId: wwcdScore?.teamId ?? 'unknown',
      scoresCount: scores.length,
      resultStatus: 'PUBLISHED',
    },
    options?.operatorUserId
  );

  return {
    success: true,
    match: updatedMatch,
    audit,
    message: `Match #${match.matchNumber} results PUBLISHED. Scores locked against direct modification.`,
  };
}

/**
 * ADMINISTRATIVE OVERRIDE OF PUBLISHED RESULTS
 * Only Super Admin or Tournament Admin can alter a published score sheet,
 * requiring explicit audit rationale.
 */
export function overridePublishedResult(
  match: MatchEntity,
  input: PublishedScoreOverrideInput
): {
  success: boolean;
  match: MatchEntity;
  audit: ResultVerificationAudit;
  message?: string;
} {
  const allowedRoles = ['SUPER_ADMIN', 'TOURNAMENT_ADMIN'];
  if (!allowedRoles.includes(input.operatorRole)) {
    const audit = auditScoreSheet(match.id, input.scores, { currentStatus: match.resultStatus });
    return {
      success: false,
      match,
      audit,
      message: `Unauthorized override attempt: Role "${input.operatorRole}" cannot override published scores. Requires SUPER_ADMIN or TOURNAMENT_ADMIN.`,
    };
  }

  if (!input.reason || input.reason.trim().length < 5) {
    const audit = auditScoreSheet(match.id, input.scores, { currentStatus: match.resultStatus });
    return {
      success: false,
      match,
      audit,
      message: 'A detailed administrative reason (min 5 characters) is required to override published scores.',
    };
  }

  const audit = auditScoreSheet(match.id, input.scores, {
    currentStatus: match.resultStatus,
  });

  if (!audit.isValid) {
    return {
      success: false,
      match,
      audit,
      message: `Override rejected: New scores failed mathematical audit.`,
    };
  }

  const updatedMatch: MatchEntity = {
    ...match,
    resultStatus: 'PUBLISHED',
  };

  // Dispatch critical override event for audit trail
  domainEventBus.emit(
    'result.overridden',
    'RESULT',
    match.id,
    {
      matchNumber: match.matchNumber,
      reason: input.reason,
      operatorRole: input.operatorRole,
      scoresCount: input.scores.length,
    },
    input.operatorUserId
  );

  return {
    success: true,
    match: updatedMatch,
    audit,
    message: `Administrative override applied to Match #${match.matchNumber}. Reason: ${input.reason}`,
  };
}
