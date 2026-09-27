import {
  GroupGenerationOptions,
  ScheduleGenerationOptions,
  GeneratedMatchSlot,
  ConflictCheckResult,
  FinalizationAuditResult,
  FinalizationCheckItem,
  GameMapName,
} from './types';

/**
 * Deterministic pseudo-random number generator (Mulberry32)
 */
function pseudoRandom(seed: number) {
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
 */
export function distributeTeamsToGroups(
  options: GroupGenerationOptions
): Map<number, Array<{ id: string; name: string }>> {
  const { groupCount, teams, seed } = options;
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
  } = options;

  const standardMaps: GameMapName[] = maps.length > 0 ? maps : ['ERANGEL', 'MIRAMAR', 'SANHOK', 'VIKENDI'];
  const slots: GeneratedMatchSlot[] = [];
  const slotStepMs = (matchDurationMinutes + breakDurationMinutes) * 60 * 1000;

  for (let i = 0; i < matchCount; i++) {
    const matchNumber = i + 1;
    const map = standardMaps[i % standardMaps.length];
    const matchTime = new Date(startTime.getTime() + i * slotStepMs);
    const assignedGroup = groupIds && groupIds.length > 0 ? groupIds[i % groupIds.length] : undefined;

    slots.push({
      matchNumber,
      title: `Match #${matchNumber} - ${map}${assignedGroup ? ' (Group)' : ''}`,
      map,
      perspective: 'TPP',
      scheduledStartTime: matchTime,
      groupId: assignedGroup,
    });
  }

  return slots;
}

/**
 * Detect scheduling and room assignment conflicts
 */
export function detectMatchConflicts(
  matches: Array<{
    id: string;
    scheduledStartTime: Date;
    durationMinutes: number;
    roomId?: string | null;
  }>
): ConflictCheckResult {
  const conflicts: string[] = [];

  for (let i = 0; i < matches.length; i++) {
    for (let j = i + 1; j < matches.length; j++) {
      const m1 = matches[i];
      const m2 = matches[j];

      // Only check room conflict if both have a room assigned
      if (m1.roomId && m2.roomId && m1.roomId === m2.roomId) {
        const start1 = m1.scheduledStartTime.getTime();
        const end1 = start1 + m1.durationMinutes * 60 * 1000;

        const start2 = m2.scheduledStartTime.getTime();
        const end2 = start2 + m2.durationMinutes * 60 * 1000;

        // Check time overlap
        if (Math.max(start1, start2) < Math.min(end1, end2)) {
          conflicts.push(
            `Room double-booked: Room ${m1.roomId} is assigned to both Match #${m1.id} and Match #${m2.id} during overlapping time windows.`
          );
        }
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
}

/**
 * Run pre-flight checks before an organizer can finalize a tournament
 */
export function auditTournamentFinalization(params: {
  totalMatches: number;
  completedMatches: number;
  verifiedResults: number;
  openDisputesCount: number;
  activeTeamsCount: number;
}): FinalizationAuditResult {
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

  const canFinalize = checklist.every((item) => item.passed);

  return {
    canFinalize,
    checklist,
  };
}
