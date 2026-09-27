import assert from 'node:assert';
import {
  calculateSingleTeamScore,
  calculateMatchScores,
  calculateTournamentLeaderboard,
  validateMatchScoreInputs,
} from '../lib/scoring/engine';
import {
  BGIS_10_POINT_SYSTEM,
  BMPS_15_POINT_SYSTEM,
  PMCO_20_POINT_SYSTEM,
} from '../lib/scoring/presets';
import {
  distributeTeamsToGroups,
  generateBalancedGroups,
  generateMatchSchedule,
  detectMatchConflicts,
  isValidTournamentTransition,
  validateTournamentTransition,
  isValidMatchTransition,
  validateMatchTransition,
  auditTournamentFinalization,
} from '../lib/tournament/engine';
import {
  TournamentCreateSchema,
  TeamCreateSchema,
  MatchResultSubmissionSchema,
  RoomUpdateSchema,
  PenaltyCreateSchema,
  DisputeCreateSchema,
  AttendanceMarkSchema,
} from '../lib/validation/schemas';
import { checkPermission } from '../lib/auth/roles';
import { exportRostersToCsv } from '../lib/export/formatters';

console.log('========================================================');
console.log('  BGMI TOURNAMENT CONTROL CENTER — MASTER TEST SUITE');
console.log('========================================================\n');

let passedTests = 0;
let failedTests = 0;

function test(description: string, fn: () => void) {
  try {
    fn();
    console.log(`  [PASS] ${description}`);
    passedTests++;
  } catch (err: any) {
    console.error(`  [FAIL] ${description}`);
    console.error(`         Reason: ${err.message}`);
    failedTests++;
  }
}

// ============================================================================
// 1. SCORING ENGINE: PRESETS, POINTS, PENALTIES, & TIE-BREAKERS
// ============================================================================
console.log('>>> 1. SCORING ENGINE: PRESETS, POINTS, PENALTIES, & TIE-BREAKERS');

test('BGIS 10-Point: 1st place WWCD with 12 kills yields 22 pts', () => {
  const res = calculateSingleTeamScore(
    { teamId: 'soul', placement: 1, kills: 12 },
    BGIS_10_POINT_SYSTEM
  );
  assert.strictEqual(res.placementPoints, 10);
  assert.strictEqual(res.killPoints, 12);
  assert.strictEqual(res.totalPoints, 22);
  assert.strictEqual(res.isWwcd, true);
});

test('BGIS 10-Point: 2nd place with 4 kills yields 10 pts', () => {
  const res = calculateSingleTeamScore(
    { teamId: 'godl', placement: 2, kills: 4 },
    BGIS_10_POINT_SYSTEM
  );
  assert.strictEqual(res.placementPoints, 6);
  assert.strictEqual(res.killPoints, 4);
  assert.strictEqual(res.totalPoints, 10);
});

test('BGIS 10-Point: 9th through 16th place receives 0 placement pts', () => {
  const res = calculateSingleTeamScore(
    { teamId: 't9', placement: 9, kills: 3 },
    BGIS_10_POINT_SYSTEM
  );
  assert.strictEqual(res.placementPoints, 0);
  assert.strictEqual(res.killPoints, 3);
  assert.strictEqual(res.totalPoints, 3);
});

test('BMPS 15-Point: 1st place with 8 kills yields 23 pts (15 + 8)', () => {
  const res = calculateSingleTeamScore(
    { teamId: 'tx', placement: 1, kills: 8 },
    BMPS_15_POINT_SYSTEM
  );
  assert.strictEqual(res.placementPoints, 15);
  assert.strictEqual(res.killPoints, 8);
  assert.strictEqual(res.totalPoints, 23);
});

test('PMCO 20-Point: 1st place with 5 kills yields 25 pts (20 + 5)', () => {
  const res = calculateSingleTeamScore(
    { teamId: 'pmco1', placement: 1, kills: 5 },
    PMCO_20_POINT_SYSTEM
  );
  assert.strictEqual(res.placementPoints, 20);
  assert.strictEqual(res.killPoints, 5);
  assert.strictEqual(res.totalPoints, 25);
});

test('Tie-Breaker: Total WWCDs breaks tie when total points are equal', () => {
  const teams = [
    { id: 'a', name: 'Alpha', tag: 'A' },
    { id: 'b', name: 'Bravo', tag: 'B' },
  ];
  const match = {
    matchId: 'm1',
    matchNumber: 1,
    teamScores: [
      {
        teamId: 'a',
        placement: 1,
        kills: 10,
        placementPoints: 10,
        killPoints: 10,
        bonusPoints: 0,
        penaltyPoints: 0,
        totalPoints: 20,
        isWwcd: true,
      },
      {
        teamId: 'b',
        placement: 2,
        kills: 14,
        placementPoints: 6,
        killPoints: 14,
        bonusPoints: 0,
        penaltyPoints: 0,
        totalPoints: 20,
        isWwcd: false,
      },
    ],
  };

  const board = calculateTournamentLeaderboard(teams, [match], [], BGIS_10_POINT_SYSTEM);
  assert.strictEqual(board[0].teamId, 'a');
  assert.strictEqual(board[0].rank, 1);
  assert.strictEqual(board[1].teamId, 'b');
  assert.strictEqual(board[1].rank, 2);
});

test('Tie-Breaker: Total Placement Points breaks tie when points and WWCDs are equal', () => {
  const teams = [
    { id: 'a', name: 'Alpha', tag: 'A' },
    { id: 'b', name: 'Bravo', tag: 'B' },
  ];
  const m1 = {
    matchId: 'm1',
    matchNumber: 1,
    teamScores: [
      { teamId: 'a', placement: 1, kills: 2, placementPoints: 10, killPoints: 2, bonusPoints: 0, penaltyPoints: 0, totalPoints: 12, isWwcd: true },
      { teamId: 'b', placement: 1, kills: 4, placementPoints: 10, killPoints: 4, bonusPoints: 0, penaltyPoints: 0, totalPoints: 14, isWwcd: true },
    ],
  };
  const m2 = {
    matchId: 'm2',
    matchNumber: 2,
    teamScores: [
      { teamId: 'a', placement: 2, kills: 4, placementPoints: 6, killPoints: 4, bonusPoints: 0, penaltyPoints: 0, totalPoints: 10, isWwcd: false },
      { teamId: 'b', placement: 3, kills: 3, placementPoints: 5, killPoints: 3, bonusPoints: 0, penaltyPoints: 0, totalPoints: 8, isWwcd: false },
    ],
  };

  const board = calculateTournamentLeaderboard(teams, [m1, m2], [], BGIS_10_POINT_SYSTEM);
  // Both have 22 points, 1 WWCD. Team A has 16 PP vs Team B has 15 PP.
  assert.strictEqual(board[0].teamId, 'a');
  assert.strictEqual(board[0].placementPoints, 16);
  assert.strictEqual(board[1].teamId, 'b');
  assert.strictEqual(board[1].placementPoints, 15);
});

// ============================================================================
// 2. TOURNAMENT ENGINE & LIFECYCLE
// ============================================================================
console.log('\n>>> 2. TOURNAMENT ENGINE & LIFECYCLE');

test('Tournament Schema: Validates complete tournament config and default settings', () => {
  const payload = {
    name: 'BGIS Grand Finals 2026',
    organizer: 'Krafton',
    startDate: '2026-10-01T10:00:00.000Z',
    endDate: '2026-10-05T20:00:00.000Z',
  };
  const res = TournamentCreateSchema.safeParse(payload);
  assert.strictEqual(res.success, true);
});

test('Tournament Lifecycle: Canonical state progression succeeds', () => {
  assert.strictEqual(isValidTournamentTransition('DRAFT', 'REGISTRATION'), true);
  assert.strictEqual(isValidTournamentTransition('REGISTRATION', 'CHECK_IN'), true);
  assert.strictEqual(isValidTournamentTransition('CHECK_IN', 'GROUPS_LOCKED'), true);
  assert.strictEqual(isValidTournamentTransition('GROUPS_LOCKED', 'SCHEDULED'), true);
  assert.strictEqual(isValidTournamentTransition('SCHEDULED', 'LIVE'), true);
  assert.strictEqual(isValidTournamentTransition('LIVE', 'RESULTS_REVIEW'), true);
  assert.strictEqual(isValidTournamentTransition('RESULTS_REVIEW', 'COMPLETED'), true);
});

test('Tournament Lifecycle: Guards reject invalid jumps (DRAFT -> LIVE)', () => {
  assert.strictEqual(isValidTournamentTransition('DRAFT', 'LIVE'), false);
  const guard = validateTournamentTransition('DRAFT', 'LIVE');
  assert.strictEqual(guard.valid, false);
});

test('Tournament Finalization Pre-Flight: Blocks completion if matches unverified', () => {
  const audit = auditTournamentFinalization({
    totalMatches: 4,
    completedMatches: 3,
    verifiedResults: 2,
    openDisputesCount: 0,
    activeTeamsCount: 16,
  });
  assert.strictEqual(audit.canFinalize, false);
});

test('Tournament Finalization Pre-Flight: Passes when 100% matches completed & verified with 0 disputes', () => {
  const audit = auditTournamentFinalization({
    totalMatches: 4,
    completedMatches: 4,
    verifiedResults: 4,
    openDisputesCount: 0,
    activeTeamsCount: 16,
  });
  assert.strictEqual(audit.canFinalize, true);
});

// ============================================================================
// 3. TEAMS & ROSTERS
// ============================================================================
console.log('\n>>> 3. TEAMS & ROSTERS');

test('Teams: Validates squad registration with roster players', () => {
  const teamPayload = {
    name: 'GodLike Esports',
    tag: 'GODL',
    captainName: 'Jonathan',
    players: [
      { name: 'Jonathan', ign: 'GODLJonathan', characterId: '5111223344', role: 'CAPTAIN' as const },
      { name: 'Neyoo', ign: 'GODLNeyoo', characterId: '5111223345', role: 'SUPPORT' as const },
    ],
  };
  const val = TeamCreateSchema.safeParse(teamPayload);
  assert.strictEqual(val.success, true);
});

test('Teams: Rejects invalid squad tags (< 2 or > 6 chars)', () => {
  assert.strictEqual(TeamCreateSchema.safeParse({ name: 'A', tag: 'X' }).success, false);
  assert.strictEqual(TeamCreateSchema.safeParse({ name: 'Valid Name', tag: 'TOOLONGTAG' }).success, false);
});

test('Teams: Rejects player with characterId < 5 digits', () => {
  const payload = {
    name: 'Team Alpha',
    tag: 'ALPH',
    players: [{ name: 'Player 1', ign: 'P1', characterId: '123' }],
  };
  assert.strictEqual(TeamCreateSchema.safeParse(payload).success, false);
});

test('Teams: Formats rosters cleanly into CSV export', () => {
  const csv = exportRostersToCsv([
    {
      name: 'Team Soul',
      tag: 'SOUL',
      captainName: 'Manya',
      players: [
        { name: 'Manya', ign: 'SOULManya', characterId: '5123456789', role: 'CAPTAIN', isSubstitute: false },
      ],
    },
  ]);
  assert.ok(csv.includes('Team Soul,SOUL,Manya,Manya,SOULManya,5123456789,CAPTAIN,Starting Lineup'));
});

// ============================================================================
// 4. GROUPS & SEEDING
// ============================================================================
console.log('\n>>> 4. GROUPS & SEEDING');

test('Groups: Divides 16 teams evenly across 4 groups (4 per group)', () => {
  const dummyTeams = Array.from({ length: 16 }, (_, i) => ({ id: `t${i + 1}`, name: `Team ${i + 1}` }));
  const groups = distributeTeamsToGroups({ tournamentId: 't1', groupCount: 4, teams: dummyTeams, seed: 99 });
  assert.strictEqual(groups.size, 4);
  for (let g = 0; g < 4; g++) {
    assert.strictEqual(groups.get(g)!.length, 4);
  }
});

test('Groups: Deterministic seed produces identical distribution across runs', () => {
  const teams = Array.from({ length: 16 }, (_, i) => ({ id: `t${i + 1}`, name: `Team ${i + 1}` }));
  const g1 = distributeTeamsToGroups({ tournamentId: 't1', groupCount: 4, teams, seed: 12345 });
  const g2 = distributeTeamsToGroups({ tournamentId: 't1', groupCount: 4, teams, seed: 12345 });
  for (let i = 0; i < 4; i++) {
    assert.deepStrictEqual(g1.get(i), g2.get(i));
  }
});

test('Groups: Throws error when attempting to reshuffle locked groups', () => {
  const teams = Array.from({ length: 16 }, (_, i) => ({ id: `t${i + 1}`, name: `Team ${i + 1}` }));
  assert.throws(
    () => distributeTeamsToGroups({ tournamentId: 't1', groupCount: 4, teams, isLocked: true }),
    /Cannot randomize teams while groups are locked/
  );
});

test('Groups: Generates balanced group metadata and teamId lists', () => {
  const teams = Array.from({ length: 8 }, (_, i) => ({ id: `t${i + 1}`, name: `Team ${i + 1}` }));
  const balanced = generateBalancedGroups({ tournamentId: 't1', groupCount: 2, teams, seed: 10 });
  assert.strictEqual(balanced.length, 2);
  assert.strictEqual(balanced[0].name, 'Group A');
  assert.strictEqual(balanced[1].name, 'Group B');
  assert.strictEqual(balanced[0].teams.length, 4);
  assert.strictEqual(balanced[0].teamIds.length, 4);
});

// ============================================================================
// 5. MATCHES & SCHEDULING
// ============================================================================
console.log('\n>>> 5. MATCHES & SCHEDULING');

test('Scheduling: Sequential slots generated with 30m match + 10m break and rotating maps', () => {
  const start = new Date('2026-09-27T18:00:00.000Z');
  const slots = generateMatchSchedule({
    tournamentId: 't1',
    matchCount: 4,
    startTime: start,
    matchDurationMinutes: 30,
    breakDurationMinutes: 10,
    maps: ['ERANGEL', 'MIRAMAR', 'SANHOK', 'VIKENDI'],
  });
  assert.strictEqual(slots.length, 4);
  assert.strictEqual(slots[0].map, 'ERANGEL');
  assert.strictEqual(slots[1].map, 'MIRAMAR');
  assert.strictEqual(slots[2].map, 'SANHOK');
  assert.strictEqual(slots[3].map, 'VIKENDI');
  assert.strictEqual(slots[1].scheduledStartTime.toISOString(), '2026-09-27T18:40:00.000Z');
});

test('Matches: Canonical operational state machine transitions', () => {
  assert.strictEqual(isValidMatchTransition('SCHEDULED', 'READY'), true);
  assert.strictEqual(isValidMatchTransition('READY', 'OPEN'), true);
  assert.strictEqual(isValidMatchTransition('OPEN', 'LIVE'), true);
  assert.strictEqual(isValidMatchTransition('LIVE', 'COMPLETED'), true);
  assert.strictEqual(isValidMatchTransition('COMPLETED', 'VERIFIED'), true);
  assert.strictEqual(isValidMatchTransition('VERIFIED', 'PUBLISHED'), true);
  assert.strictEqual(isValidMatchTransition('PUBLISHED', 'VERIFIED'), true); // Administrative rollback
});

test('Matches: Rejects illegal non-sequential match transitions', () => {
  assert.strictEqual(isValidMatchTransition('SCHEDULED', 'LIVE'), false);
  assert.strictEqual(isValidMatchTransition('COMPLETED', 'OPEN'), false);
});

test('Conflicts: Detects team concurrency conflict on overlapping match times', () => {
  const baseTime = new Date('2026-09-27T18:00:00.000Z');
  const res = detectMatchConflicts([
    { id: '1', scheduledStartTime: baseTime, durationMinutes: 40, teamIds: ['team_soul'] },
    { id: '2', scheduledStartTime: new Date(baseTime.getTime() + 20 * 60 * 1000), durationMinutes: 40, teamIds: ['team_soul'] },
  ]);
  assert.strictEqual(res.hasConflict, true);
  assert.ok(res.conflicts.some((c) => c.includes('Team concurrency conflict')));
});

// ============================================================================
// 6. ROOMS & SECURITY
// ============================================================================
console.log('\n>>> 6. ROOMS & SECURITY');

test('Rooms: Detects room double-booking during overlapping matches', () => {
  const baseTime = new Date('2026-09-27T18:00:00.000Z');
  const result = detectMatchConflicts([
    { id: '1', scheduledStartTime: baseTime, durationMinutes: 40, roomId: 'room_a' },
    { id: '2', scheduledStartTime: new Date(baseTime.getTime() + 20 * 60 * 1000), durationMinutes: 40, roomId: 'room_a' },
  ]);
  assert.strictEqual(result.hasConflict, true);
  assert.ok(result.conflicts.some((c) => c.includes('Room double-booked')));
});

test('Rooms: Validates RoomUpdateSchema credentials and operational status', () => {
  const valid = { roomId: '1234567', password: 'secretpassword', status: 'READY' as const };
  assert.strictEqual(RoomUpdateSchema.safeParse(valid).success, true);
});

test('Rooms RBAC: Prohibits OBSERVER and SCOREKEEPER from seeing room passwords', () => {
  assert.strictEqual(checkPermission('OBSERVER', 'canSeeRoomPasswords'), false);
  assert.strictEqual(checkPermission('SCOREKEEPER', 'canSeeRoomPasswords'), false);
  assert.strictEqual(checkPermission('MATCH_ADMIN', 'canSeeRoomPasswords'), true);
  assert.strictEqual(checkPermission('SUPER_ADMIN', 'canSeeRoomPasswords'), true);
});

// ============================================================================
// 7. ATTENDANCE
// ============================================================================
console.log('\n>>> 7. ATTENDANCE');

test('Attendance: Validates check-in statuses (PRESENT, ABSENT, LATE, DISQUALIFIED, WITHDRAWN)', () => {
  const statuses = ['PRESENT', 'ABSENT', 'LATE', 'DISQUALIFIED', 'WITHDRAWN'] as const;
  for (const s of statuses) {
    const res = AttendanceMarkSchema.safeParse({ teamId: 'soul', status: s, checkedInBy: 'Marshal' });
    assert.strictEqual(res.success, true);
  }
});

test('Attendance: Rejects unknown attendance status', () => {
  const res = AttendanceMarkSchema.safeParse({ teamId: 'soul', status: 'CHECKED_IN' });
  assert.strictEqual(res.success, false);
});

// ============================================================================
// 8. RESULTS & SCORE ENTRY
// ============================================================================
console.log('\n>>> 8. RESULTS & SCORE ENTRY');

test('Results: Rejects duplicate placement ranks', () => {
  const inputs = [
    { teamId: 't1', placement: 1, kills: 5 },
    { teamId: 't2', placement: 1, kills: 3 },
  ];
  const val = validateMatchScoreInputs(inputs, 2);
  assert.strictEqual(val.isValid, false);
  assert.ok(val.errors.some((e) => e.includes('Duplicate placement rank #1')));
});

test('Results: Rejects duplicate team entries', () => {
  const inputs = [
    { teamId: 't1', placement: 1, kills: 5 },
    { teamId: 't1', placement: 2, kills: 3 },
  ];
  const val = validateMatchScoreInputs(inputs, 2);
  assert.strictEqual(val.isValid, false);
  assert.ok(val.errors.some((e) => e.includes('Duplicate team entry')));
});

test('Results: Rejects negative kill counts', () => {
  const inputs = [{ teamId: 't1', placement: 1, kills: -2 }];
  const val = validateMatchScoreInputs(inputs, 1);
  assert.strictEqual(val.isValid, false);
  assert.ok(val.errors.some((e) => e.includes('negative')));
});

test('Results: Validates MatchResultSubmissionSchema structure', () => {
  const payload = {
    resultStatus: 'SUBMITTED' as const,
    scores: [
      { teamId: 't1', placement: 1, kills: 10, bonusPoints: 0, penaltyPoints: 0 },
      { teamId: 't2', placement: 2, kills: 5, bonusPoints: 0, penaltyPoints: 0 },
    ],
  };
  assert.strictEqual(MatchResultSubmissionSchema.safeParse(payload).success, true);
});

// ============================================================================
// 9. PENALTIES
// ============================================================================
console.log('\n>>> 9. PENALTIES');

test('Penalties: Validates positive penalty deduction schema', () => {
  const valid = { teamId: 'soul', pointsDeducted: 5, reason: 'Late room entry' };
  assert.strictEqual(PenaltyCreateSchema.safeParse(valid).success, true);

  const nonPositive = { teamId: 'soul', pointsDeducted: 0, reason: 'Warning' };
  assert.strictEqual(PenaltyCreateSchema.safeParse(nonPositive).success, false);
});

test('Penalties: Active penalty properly reduces net standing score', () => {
  const teams = [
    { id: 'a', name: 'Alpha', tag: 'A' },
    { id: 'b', name: 'Bravo', tag: 'B' },
  ];
  const match = {
    matchId: 'm1',
    matchNumber: 1,
    teamScores: [
      { teamId: 'a', placement: 1, kills: 10, placementPoints: 10, killPoints: 10, bonusPoints: 0, penaltyPoints: 0, totalPoints: 20, isWwcd: true },
      { teamId: 'b', placement: 2, kills: 5, placementPoints: 6, killPoints: 5, bonusPoints: 0, penaltyPoints: 0, totalPoints: 11, isWwcd: false },
    ],
  };
  const penalties = [{ teamId: 'a', pointsDeducted: 10, status: 'ACTIVE' }];

  const board = calculateTournamentLeaderboard(teams, [match], penalties, BGIS_10_POINT_SYSTEM);
  assert.strictEqual(board[0].teamId, 'b');
  assert.strictEqual(board[0].totalPoints, 11);
  assert.strictEqual(board[1].teamId, 'a');
  assert.strictEqual(board[1].totalPoints, 10);
});

test('Penalties: Inactive or VOIDED penalties do not reduce standings score', () => {
  const teams = [
    { id: 'a', name: 'Alpha', tag: 'A' },
    { id: 'b', name: 'Bravo', tag: 'B' },
  ];
  const match = {
    matchId: 'm1',
    matchNumber: 1,
    teamScores: [
      { teamId: 'a', placement: 1, kills: 10, placementPoints: 10, killPoints: 10, bonusPoints: 0, penaltyPoints: 0, totalPoints: 20, isWwcd: true },
    ],
  };
  const penalties = [{ teamId: 'a', pointsDeducted: 10, status: 'VOIDED' }];

  const board = calculateTournamentLeaderboard(teams, [match], penalties, BGIS_10_POINT_SYSTEM);
  assert.strictEqual(board[0].totalPoints, 20);
});

test('Penalties: Total score is floored at 0 even if penalty exceeds score', () => {
  const teams = [{ id: 'a', name: 'Alpha', tag: 'A' }];
  const match = {
    matchId: 'm1',
    matchNumber: 1,
    teamScores: [
      { teamId: 'a', placement: 16, kills: 0, placementPoints: 0, killPoints: 0, bonusPoints: 0, penaltyPoints: 0, totalPoints: 0, isWwcd: false },
    ],
  };
  const penalties = [{ teamId: 'a', pointsDeducted: 50, status: 'ACTIVE' }];
  const board = calculateTournamentLeaderboard(teams, [match], penalties, BGIS_10_POINT_SYSTEM);
  assert.strictEqual(board[0].totalPoints, 0);
});

// ============================================================================
// 10. DISPUTES
// ============================================================================
console.log('\n>>> 10. DISPUTES');

test('Disputes: Validates dispute ticket creation schema', () => {
  const valid = {
    teamId: 'soul',
    category: 'SCORING',
    description: 'Kill count was missing 2 eliminations',
  };
  assert.strictEqual(DisputeCreateSchema.safeParse(valid).success, true);
});

test('Disputes: Rejects dispute with description < 5 characters', () => {
  const invalid = { teamId: 'soul', description: 'Bug' };
  assert.strictEqual(DisputeCreateSchema.safeParse(invalid).success, false);
});

test('Disputes: Open disputes block tournament finalization pre-flight audit', () => {
  const blocked = auditTournamentFinalization({
    totalMatches: 4,
    completedMatches: 4,
    verifiedResults: 4,
    openDisputesCount: 2,
    activeTeamsCount: 16,
  });
  assert.strictEqual(blocked.canFinalize, false);

  const resolved = auditTournamentFinalization({
    totalMatches: 4,
    completedMatches: 4,
    verifiedResults: 4,
    openDisputesCount: 0,
    activeTeamsCount: 16,
  });
  assert.strictEqual(resolved.canFinalize, true);
});

// ============================================================================
// 11. END-TO-END OPERATIONAL LIFECYCLE WORKFLOW
// ============================================================================
console.log('\n>>> 11. END-TO-END OPERATIONAL LIFECYCLE WORKFLOW');

test('E2E: Full 14-step tournament operations journey executes with 100% integrity', () => {
  // Step 1: Create tournament payload
  const tourneyRes = TournamentCreateSchema.safeParse({
    name: 'BGMI Masters 2026',
    organizer: 'Krafton',
    startDate: '2026-10-01T10:00:00.000Z',
    endDate: '2026-10-05T20:00:00.000Z',
  });
  assert.strictEqual(tourneyRes.success, true);

  // Step 2: Register 16 squads
  const squads = Array.from({ length: 16 }, (_, i) => ({
    id: `sq_${i + 1}`,
    name: `Squad ${i + 1}`,
    tag: `SQ${i + 1}`,
  }));
  assert.strictEqual(squads.length, 16);

  // Step 3: Seed 4 balanced groups (4 teams each)
  const groups = generateBalancedGroups({ tournamentId: 't1', groupCount: 4, teams: squads, seed: 777 });
  assert.strictEqual(groups.length, 4);
  assert.strictEqual(groups[0].teams.length, 4);

  // Step 4: Lock groups
  const lock = validateTournamentTransition('CHECK_IN', 'GROUPS_LOCKED', { groupsConfigured: true });
  assert.strictEqual(lock.valid, true);

  // Step 5: Schedule matches
  const schedule = generateMatchSchedule({
    tournamentId: 't1',
    matchCount: 4,
    startTime: new Date('2026-10-01T14:00:00.000Z'),
    matchDurationMinutes: 30,
    breakDurationMinutes: 10,
    maps: ['ERANGEL', 'MIRAMAR', 'SANHOK', 'VIKENDI'],
  });
  assert.strictEqual(schedule.length, 4);

  // Step 6: Conflict audit
  const conflicts = detectMatchConflicts(
    schedule.map((s, idx) => ({
      id: `m_${idx + 1}`,
      scheduledStartTime: s.scheduledStartTime,
      durationMinutes: 30,
      roomId: `r_${idx + 1}`,
    }))
  );
  assert.strictEqual(conflicts.hasConflict, false);

  // Step 7: Room credentials & RBAC
  assert.strictEqual(RoomUpdateSchema.safeParse({ roomId: '1001', password: 'pw', status: 'READY' as const }).success, true);
  assert.strictEqual(checkPermission('OBSERVER', 'canSeeRoomPasswords'), false);
  assert.strictEqual(checkPermission('MATCH_ADMIN', 'canSeeRoomPasswords'), true);

  // Step 8: Attendance
  assert.strictEqual(AttendanceMarkSchema.safeParse({ teamId: squads[0].id, status: 'PRESENT' as const }).success, true);

  // Step 9: Match operational state LIVE
  assert.strictEqual(validateMatchTransition('SCHEDULED', 'READY').valid, true);
  assert.strictEqual(validateMatchTransition('READY', 'OPEN').valid, true);
  assert.strictEqual(validateMatchTransition('OPEN', 'LIVE').valid, true);

  // Step 10: Score sheet submission
  const rawScores = squads.map((sq, idx) => ({
    teamId: sq.id,
    placement: idx + 1,
    kills: 16 - idx,
  }));
  assert.strictEqual(validateMatchScoreInputs(rawScores, 16).isValid, true);
  const matchScores = calculateMatchScores(rawScores, BGIS_10_POINT_SYSTEM);
  assert.strictEqual(matchScores[0].isWwcd, true);

  // Step 11: Result verification and publishing
  assert.strictEqual(validateMatchTransition('LIVE', 'COMPLETED').valid, true);
  assert.strictEqual(validateMatchTransition('COMPLETED', 'VERIFIED').valid, true);
  assert.strictEqual(validateMatchTransition('VERIFIED', 'PUBLISHED').valid, true);

  // Step 12: Live leaderboard
  const lb1 = calculateTournamentLeaderboard(squads, [{ matchId: 'm1', matchNumber: 1, teamScores: matchScores }], [], BGIS_10_POINT_SYSTEM);
  assert.strictEqual(lb1[0].teamId, squads[0].id);
  assert.strictEqual(lb1[0].totalPoints, 26); // 10 placement + 16 kills

  // Step 13: Penalty deduction
  const lb2 = calculateTournamentLeaderboard(
    squads,
    [{ matchId: 'm1', matchNumber: 1, teamScores: matchScores }],
    [{ teamId: squads[0].id, pointsDeducted: 10, status: 'ACTIVE' }],
    BGIS_10_POINT_SYSTEM
  );
  const team1Standing = lb2.find((s) => s.teamId === squads[0].id);
  assert.strictEqual(team1Standing?.totalPoints, 16);

  // Step 14: Dispute & Finalization
  assert.strictEqual(DisputeCreateSchema.safeParse({ teamId: squads[1].id, description: 'Score protest' }).success, true);
  const auditBlocked = auditTournamentFinalization({ totalMatches: 1, completedMatches: 1, verifiedResults: 1, openDisputesCount: 1, activeTeamsCount: 16 });
  assert.strictEqual(auditBlocked.canFinalize, false);
  const auditPassed = auditTournamentFinalization({ totalMatches: 1, completedMatches: 1, verifiedResults: 1, openDisputesCount: 0, activeTeamsCount: 16 });
  assert.strictEqual(auditPassed.canFinalize, true);
  assert.strictEqual(validateTournamentTransition('RESULTS_REVIEW', 'COMPLETED', { auditResult: auditPassed }).valid, true);
});

console.log(`\n--------------------------------------------------------`);
console.log(`  TOTAL: ${passedTests + failedTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
console.log(`--------------------------------------------------------\n`);

if (failedTests > 0) {
  process.exit(1);
}
