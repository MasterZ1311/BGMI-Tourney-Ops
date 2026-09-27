import {
  TournamentStatus,
  MatchOperationalStatus,
  GroupGenerationOptions,
  BalancedGroup,
  ScheduleGenerationOptions,
  GeneratedMatchSlot,
  MatchConflictInput,
  ConflictCheckOptions,
  ConflictCheckResult,
  TournamentTransitionContext,
  StateTransitionResult,
  MatchStateTransitionResult,
  FinalizationAuditParams,
  FinalizationAuditResult,
  FinalizationCheckItem,
  GameMapName,
} from './types';

export const STANDARD_BGMI_MAPS: GameMapName[] = [
  'ERANGEL',
  'MIRAMAR',
  'SANHOK',
  'VIKENDI',
];

export const ALL_BGMI_MAPS: GameMapName[] = [
  'ERANGEL',
  'MIRAMAR',
  'SANHOK',
  'VIKENDI',
  'RONDO',
];

/**
 * Deterministic pseudo-random number generator (Mulberry32)
 */
export function pseudoRandom(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Shuffle an array with an optional seed for deterministic group balancing
 */
export function shuffleArray<T>(array: T[], seed?: number): T[] {
  const result = [...array];
  const rng = seed !== undefined ? pseudoRandom(seed) : Math.random;

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * Distribute teams evenly across N groups
 * Respects group locking guards: throws if groups are locked.
 */
export function distributeTeamsToGroups(
  options: GroupGenerationOptions
): Map<number, Array<{ id: string; name: string }>> {
  const { groupCount, teams, seed, isLocked, groups } = options;

  // Guard against distributing into locked groups
  if (isLocked) {
    throw new Error('Cannot randomize teams while groups are locked. Unlock them first.');
  }

  if (groups && groups.some((g) => g.isLocked)) {
    throw new Error('Cannot randomize teams while groups are locked. Unlock them first.');
  }

  if (groupCount <= 0) {
    throw new Error('Group count must be greater than 0.');
  }

  const shuffled = shuffleArray(teams, seed);
  const groupsMap = new Map<number, Array<{ id: string; name: string }>>();

  for (let g = 0; g < groupCount; g++) {
    groupsMap.set(g, []);
  }

  shuffled.forEach((team, index) => {
    const targetGroup = index % groupCount;
    groupsMap.get(targetGroup)?.push(team);
  });

  return groupsMap;
}

/**
 * Generate balanced groups structure with group metadata, team lists, and team IDs
 */
export function generateBalancedGroups(
  options: GroupGenerationOptions
): BalancedGroup[] {
  const groupsMap = distributeTeamsToGroups(options);
  const result: BalancedGroup[] = [];

  for (let g = 0; g < options.groupCount; g++) {
    const groupTeams = groupsMap.get(g) || [];
    const matchedGroup = options.groups?.[g];
    const defaultGroupName = `Group ${String.fromCharCode(65 + g)}`;
    const groupName = matchedGroup?.name || defaultGroupName;

    result.push({
      groupIndex: g,
      groupId: matchedGroup?.id,
      name: groupName,
      teams: groupTeams,
      teamIds: groupTeams.map((t) => t.id),
    });
  }

  return result;
}

/**
 * Generate sequential match timetable with rotating BGMI maps
 */
export function generateMatchSchedule(
  options: ScheduleGenerationOptions
): GeneratedMatchSlot[] {
  const {
    matchCount,
    startTime,
    matchDurationMinutes,
    breakDurationMinutes,
    maps,
    groupIds,
    perspective = 'TPP',
  } = options;

  if (matchCount <= 0) {
    return [];
  }

  const standardMaps: GameMapName[] =
    maps && maps.length > 0 ? maps : STANDARD_BGMI_MAPS;
  const slots: GeneratedMatchSlot[] = [];
  const slotStepMs = (Math.max(0, matchDurationMinutes) + Math.max(0, breakDurationMinutes)) * 60 * 1000;
  const baseTimestamp = startTime.getTime();

  for (let i = 0; i < matchCount; i++) {
    const matchNumber = i + 1;
    const map = standardMaps[i % standardMaps.length];
    const matchTime = new Date(baseTimestamp + i * slotStepMs);
    const assignedGroup =
      groupIds && groupIds.length > 0 ? groupIds[i % groupIds.length] : undefined;

    slots.push({
      matchNumber,
      title: `Match #${matchNumber} - ${map}${assignedGroup ? ' (Group)' : ''}`,
      map,
      perspective,
      scheduledStartTime: matchTime,
      groupId: assignedGroup,
    });
  }

  return slots;
}

/**
 * Extract normalized date from Date or string
 */
function parseDate(d: Date | string): Date {
  return typeof d === 'string' ? new Date(d) : d;
}

/**
 * Detect scheduling, room assignment, team concurrency, and timing conflicts
 */
export function detectMatchConflicts(
  matches: MatchConflictInput[],
  options?: ConflictCheckOptions
): ConflictCheckResult {
  const conflicts: string[] = [];
  const parsedMatches = matches.map((m) => {
    const parsedStart = parseDate(m.scheduledStartTime);
    const duration = m.durationMinutes ?? m.matchDurationMinutes ?? 30;
    const roomId = m.roomId || m.room?.id || m.room?.roomId || null;
    const teamIds: string[] = [
      ...(m.teamIds || []),
      ...(m.teams ? m.teams.map((t) => t.id) : []),
    ];

    return {
      raw: m,
      id: m.id,
      matchNumber: m.matchNumber,
      startTime: parsedStart,
      startTimeMs: parsedStart.getTime(),
      durationMinutes: duration,
      endTimeMs: parsedStart.getTime() + duration * 60 * 1000,
      roomId,
      teamIds: Array.from(new Set(teamIds)),
      groupId: m.groupId || null,
    };
  });

  // 1. Validate individual match time parameters
  for (const m of parsedMatches) {
    if (isNaN(m.startTimeMs)) {
      conflicts.push(`Match #${m.id} has an invalid scheduled start time.`);
      continue;
    }

    if (m.durationMinutes <= 0) {
      conflicts.push(
        `Match #${m.id} has an invalid duration (${m.durationMinutes} mins). Duration must be greater than 0.`
      );
    }

    if (options?.checkPastTimes && options.now) {
      if (m.startTimeMs < options.now.getTime()) {
        conflicts.push(`Match #${m.id} scheduled start time is in the past.`);
      }
    }
  }

  // 2. Cross-match concurrency checks
  for (let i = 0; i < parsedMatches.length; i++) {
    for (let j = i + 1; j < parsedMatches.length; j++) {
      const m1 = parsedMatches[i];
      const m2 = parsedMatches[j];

      if (isNaN(m1.startTimeMs) || isNaN(m2.startTimeMs)) {
        continue;
      }

      // Check time overlap: [start1, end1) and [start2, end2)
      const isOverlapping =
        Math.max(m1.startTimeMs, m2.startTimeMs) < Math.min(m1.endTimeMs, m2.endTimeMs);

      if (!isOverlapping) {
        continue;
      }

      // 2a. Room double-booking conflict
      if (m1.roomId && m2.roomId && m1.roomId === m2.roomId) {
        conflicts.push(
          `Room double-booked: Room ${m1.roomId} is assigned to both Match #${m1.id} and Match #${m2.id} during overlapping time windows.`
        );
      }

      // 2b. Team concurrency conflict (same team in concurrent matches)
      if (m1.teamIds.length > 0 && m2.teamIds.length > 0) {
        const sharedTeams = m1.teamIds.filter((tId) => m2.teamIds.includes(tId));
        for (const teamId of sharedTeams) {
          conflicts.push(
            `Team concurrency conflict: Team ${teamId} is scheduled in both Match #${m1.id} and Match #${m2.id} during overlapping time windows.`
          );
        }
      }

      // 2c. Group concurrency conflict (same group in concurrent matches)
      if (m1.groupId && m2.groupId && m1.groupId === m2.groupId) {
        conflicts.push(
          `Group concurrency conflict: Group ${m1.groupId} is scheduled in concurrent matches (Match #${m1.id} and Match #${m2.id}).`
        );
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
}

/**
 * Alias for detectMatchConflicts
 */
export const detectSchedulingConflicts = detectMatchConflicts;

// ============================================================================
// TOURNAMENT & MATCH LIFECYCLE STATE MACHINES
// ============================================================================

export const VALID_TOURNAMENT_TRANSITIONS: Record<TournamentStatus, TournamentStatus[]> = {
  DRAFT: ['REGISTRATION', 'ARCHIVED'],
  REGISTRATION: ['CHECK_IN', 'DRAFT', 'ARCHIVED'],
  CHECK_IN: ['GROUPS_LOCKED', 'REGISTRATION', 'ARCHIVED'],
  GROUPS_LOCKED: ['SCHEDULED', 'CHECK_IN', 'ARCHIVED'],
  SCHEDULED: ['LIVE', 'GROUPS_LOCKED', 'ARCHIVED'],
  LIVE: ['RESULTS_REVIEW'],
  RESULTS_REVIEW: ['COMPLETED', 'LIVE'],
  COMPLETED: ['ARCHIVED'],
  ARCHIVED: [],
};

/**
 * Check whether a tournament status transition is statically permitted
 */
export function isValidTournamentTransition(
  currentStatus: TournamentStatus,
  nextStatus: TournamentStatus
): boolean {
  const allowed = VALID_TOURNAMENT_TRANSITIONS[currentStatus];
  return Boolean(allowed && allowed.includes(nextStatus));
}

/**
 * Get all permitted next statuses for a given tournament status
 */
export function getNextAllowedTournamentStatuses(
  currentStatus: TournamentStatus
): TournamentStatus[] {
  return VALID_TOURNAMENT_TRANSITIONS[currentStatus] || [];
}

/**
 * Validate tournament state transition with optional operational contextual guards
 */
export function validateTournamentTransition(
  currentStatus: TournamentStatus,
  nextStatus: TournamentStatus,
  context?: TournamentTransitionContext
): StateTransitionResult {
  if (!isValidTournamentTransition(currentStatus, nextStatus)) {
    return {
      valid: false,
      from: currentStatus,
      to: nextStatus,
      error: `Invalid tournament state transition from ${currentStatus} to ${nextStatus}.`,
    };
  }

  // Guard: REGISTRATION -> CHECK_IN requires minimum participating teams
  if (currentStatus === 'REGISTRATION' && nextStatus === 'CHECK_IN' && context) {
    const minTeams = context.minTeams ?? 16;
    if (
      context.registeredTeamsCount !== undefined &&
      context.registeredTeamsCount < minTeams
    ) {
      return {
        valid: false,
        from: currentStatus,
        to: nextStatus,
        error: `Cannot transition to CHECK_IN: At least ${minTeams} teams required (currently ${context.registeredTeamsCount}).`,
      };
    }
  }

  // Guard: CHECK_IN -> GROUPS_LOCKED requires groups configured
  if (currentStatus === 'CHECK_IN' && nextStatus === 'GROUPS_LOCKED' && context) {
    if (context.groupsConfigured === false) {
      return {
        valid: false,
        from: currentStatus,
        to: nextStatus,
        error: 'Cannot transition to GROUPS_LOCKED: Groups must be configured and populated.',
      };
    }
  }

  // Guard: GROUPS_LOCKED -> SCHEDULED requires groups to be locked
  if (currentStatus === 'GROUPS_LOCKED' && nextStatus === 'SCHEDULED' && context) {
    if (context.groupsLocked === false) {
      return {
        valid: false,
        from: currentStatus,
        to: nextStatus,
        error: 'Cannot transition to SCHEDULED: Groups must be locked first.',
      };
    }
  }

  // Guard: SCHEDULED -> LIVE requires rooms initialized
  if (currentStatus === 'SCHEDULED' && nextStatus === 'LIVE' && context) {
    if (context.hasInitializedRooms === false) {
      return {
        valid: false,
        from: currentStatus,
        to: nextStatus,
        error: 'Cannot transition to LIVE: Rooms must be initialized with maps and scheduled start times.',
      };
    }
  }

  // Guard: LIVE -> RESULTS_REVIEW requires all matches completed
  if (currentStatus === 'LIVE' && nextStatus === 'RESULTS_REVIEW' && context) {
    if (context.allMatchesFinished === false) {
      return {
        valid: false,
        from: currentStatus,
        to: nextStatus,
        error: 'Cannot transition to RESULTS_REVIEW: All live matches must be concluded.',
      };
    }
  }

  // Guard: RESULTS_REVIEW -> COMPLETED requires pre-flight audit pass
  if (currentStatus === 'RESULTS_REVIEW' && nextStatus === 'COMPLETED' && context) {
    if (context.auditResult && !context.auditResult.canFinalize) {
      return {
        valid: false,
        from: currentStatus,
        to: nextStatus,
        error: 'Cannot transition to COMPLETED: Tournament pre-flight audit failed.',
      };
    }
  }

  return {
    valid: true,
    from: currentStatus,
    to: nextStatus,
  };
}

export const VALID_MATCH_TRANSITIONS: Record<MatchOperationalStatus, MatchOperationalStatus[]> = {
  SCHEDULED: ['READY', 'CANCELLED'],
  READY: ['OPEN', 'SCHEDULED', 'CANCELLED'],
  OPEN: ['LIVE', 'READY', 'CANCELLED'],
  LIVE: ['COMPLETED', 'CANCELLED'],
  COMPLETED: ['VERIFIED', 'LIVE'],
  VERIFIED: ['PUBLISHED', 'COMPLETED'],
  PUBLISHED: ['VERIFIED'], // Administrative correction rollback
  CANCELLED: [],
};

/**
 * Check whether a match operational status transition is statically permitted
 */
export function isValidMatchTransition(
  currentStatus: MatchOperationalStatus,
  nextStatus: MatchOperationalStatus
): boolean {
  const allowed = VALID_MATCH_TRANSITIONS[currentStatus];
  return Boolean(allowed && allowed.includes(nextStatus));
}

/**
 * Get all permitted next statuses for a given match status
 */
export function getNextAllowedMatchStatuses(
  currentStatus: MatchOperationalStatus
): MatchOperationalStatus[] {
  return VALID_MATCH_TRANSITIONS[currentStatus] || [];
}

/**
 * Validate match operational status transition
 */
export function validateMatchTransition(
  currentStatus: MatchOperationalStatus,
  nextStatus: MatchOperationalStatus
): MatchStateTransitionResult {
  if (!isValidMatchTransition(currentStatus, nextStatus)) {
    return {
      valid: false,
      from: currentStatus,
      to: nextStatus,
      error: `Invalid match state transition from ${currentStatus} to ${nextStatus}.`,
    };
  }

  return {
    valid: true,
    from: currentStatus,
    to: nextStatus,
  };
}

// ============================================================================
// PRE-FLIGHT FINALIZATION AUDIT
// ============================================================================

/**
 * Run pre-flight checks before an organizer can officially finalize a tournament.
 * Accepts either (params) or (tournamentId, params) signature.
 */
export function auditTournamentFinalization(
  paramsOrId: string | FinalizationAuditParams,
  maybeParams?: FinalizationAuditParams
): FinalizationAuditResult {
  const params = typeof paramsOrId === 'string' ? maybeParams! : paramsOrId;

  const checklist: FinalizationCheckItem[] = [
    {
      id: 'matches_complete',
      label: 'All Scheduled Matches Completed',
      passed: params.totalMatches > 0 && params.completedMatches >= params.totalMatches,
      details: `${params.completedMatches}/${params.totalMatches} matches completed`,
    },
    {
      id: 'results_verified',
      label: 'All Match Results Verified & Published',
      passed: params.totalMatches > 0 && params.verifiedResults >= params.totalMatches,
      details: `${params.verifiedResults}/${params.totalMatches} results verified`,
    },
    {
      id: 'disputes_resolved',
      label: 'Zero Open / Pending Disputes',
      passed: params.openDisputesCount === 0,
      details: `${params.openDisputesCount} open disputes remaining`,
    },
    {
      id: 'active_teams',
      label: 'Active Participating Teams Present',
      passed: params.activeTeamsCount >= 2,
      details: `${params.activeTeamsCount} teams registered`,
    },
  ];

  // Optional extended check: unconfirmed penalties
  if (params.unconfirmedPenaltiesCount !== undefined) {
    checklist.push({
      id: 'penalties_confirmed',
      label: 'All Penalties Confirmed & Applied',
      passed: params.unconfirmedPenaltiesCount === 0,
      details: `${params.unconfirmedPenaltiesCount} unconfirmed penalties pending`,
    });
  }

  // Optional extended check: unresolved tiebreakers
  if (params.unresolvedTiesCount !== undefined) {
    checklist.push({
      id: 'tiebreakers_resolved',
      label: 'Standings Tie-Breakers Fully Resolved',
      passed: params.unresolvedTiesCount === 0,
      details: `${params.unresolvedTiesCount} tie-breaker collisions pending resolution`,
    });
  }

  const canFinalize = checklist.every((item) => item.passed);

  return {
    canFinalize,
    checklist,
  };
}
