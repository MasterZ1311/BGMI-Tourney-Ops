import assert from 'node:assert';
import {
  calculateSingleTeamScore,
  calculateMatchScores,
  calculateTournamentLeaderboard,
  validateMatchScoreInputs,
} from '../lib/scoring/engine.js';
import {
  BGIS_10_POINT_SYSTEM,
  BMPS_15_POINT_SYSTEM,
  PMCO_20_POINT_SYSTEM,
} from '../lib/scoring/presets.js';
import {
  distributeTeamsToGroups,
  generateMatchSchedule,
  detectMatchConflicts,
  auditTournamentFinalization,
} from '../lib/tournament/engine.js';

console.log('🏁 Running BGMI Tournament Control Center Test Suite...\n');

let passedTests = 0;
let failedTests = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${description}`);
    console.error(`     Error: ${err.message}`);
    failedTests++;
  }
}

// 1. Scoring Engine Tests
console.log('📌 Module: Scoring Engine (BGIS, BMPS, Tie-Breakers)');

test('BGIS 10-Point: 1st place WWCD with 12 kills = 22 pts', () => {
  const res = calculateSingleTeamScore(
    { teamId: 'soul', placement: 1, kills: 12 },
    BGIS_10_POINT_SYSTEM
  );
  assert.strictEqual(res.placementPoints, 10);
  assert.strictEqual(res.killPoints, 12);
  assert.strictEqual(res.totalPoints, 22);
  assert.strictEqual(res.isWwcd, true);
});

test('BGIS 10-Point: 2nd place with 4 kills = 10 pts', () => {
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

test('BMPS 15-Point: 1st place with 8 kills = 23 pts (15 + 8)', () => {
  const res = calculateSingleTeamScore(
    { teamId: 'tx', placement: 1, kills: 8 },
    BMPS_15_POINT_SYSTEM
  );
  assert.strictEqual(res.placementPoints, 15);
  assert.strictEqual(res.killPoints, 8);
  assert.strictEqual(res.totalPoints, 23);
});

test('Validation: Rejects duplicate placement ranks', () => {
  const inputs = [
    { teamId: 't1', placement: 1, kills: 5 },
    { teamId: 't2', placement: 1, kills: 3 },
  ];
  const val = validateMatchScoreInputs(inputs, 2);
  assert.strictEqual(val.isValid, false);
  assert.ok(val.errors.some((e) => e.includes('Duplicate placement rank #1')));
});

test('Validation: Rejects negative kill counts', () => {
  const inputs = [{ teamId: 't1', placement: 1, kills: -2 }];
  const val = validateMatchScoreInputs(inputs, 1);
  assert.strictEqual(val.isValid, false);
  assert.ok(val.errors.some((e) => e.includes('negative')));
});

test('Leaderboard Tie-Breaker: WWCD wins tie on total points', () => {
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

test('Penalties: Tournament penalty deduction reduces net score', () => {
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
        kills: 5,
        placementPoints: 6,
        killPoints: 5,
        bonusPoints: 0,
        penaltyPoints: 0,
        totalPoints: 11,
        isWwcd: false,
      },
    ],
  };
  const penalties = [{ teamId: 'a', pointsDeducted: 10, status: 'ACTIVE' }];

  const board = calculateTournamentLeaderboard(teams, [match], penalties, BGIS_10_POINT_SYSTEM);
  assert.strictEqual(board[0].teamId, 'b'); // Bravo (11 pts) ranks 1st
  assert.strictEqual(board[0].totalPoints, 11);
  assert.strictEqual(board[1].teamId, 'a'); // Alpha (20 - 10 = 10 pts) ranks 2nd
  assert.strictEqual(board[1].totalPoints, 10);
});

// 2. Tournament Engine Tests
console.log('\n📌 Module: Tournament Engine (Scheduling, Conflicts, Audit)');

test('Groups: Divides 16 teams evenly across 4 groups (4 per group)', () => {
  const dummyTeams = Array.from({ length: 16 }, (_, i) => ({ id: `t${i + 1}`, name: `Team ${i + 1}` }));
  const groups = distributeTeamsToGroups({ tournamentId: 't1', groupCount: 4, teams: dummyTeams, seed: 99 });
  assert.strictEqual(groups.size, 4);
  for (let g = 0; g < 4; g++) {
    assert.strictEqual(groups.get(g).length, 4);
  }
});

test('Scheduling: Sequential slots generated with 30m match + 10m break', () => {
  const start = new Date('2026-09-27T18:00:00.000Z');
  const slots = generateMatchSchedule({
    tournamentId: 't1',
    matchCount: 3,
    startTime: start,
    matchDurationMinutes: 30,
    breakDurationMinutes: 10,
    maps: ['ERANGEL', 'MIRAMAR', 'SANHOK'],
  });
  assert.strictEqual(slots.length, 3);
  assert.strictEqual(slots[0].map, 'ERANGEL');
  assert.strictEqual(slots[1].scheduledStartTime.toISOString(), '2026-09-27T18:40:00.000Z');
});

test('Conflicts: Detects room double-booking during overlapping matches', () => {
  const baseTime = new Date('2026-09-27T18:00:00.000Z');
  const result = detectMatchConflicts([
    { id: '1', scheduledStartTime: baseTime, durationMinutes: 40, roomId: 'room_a' },
    { id: '2', scheduledStartTime: new Date(baseTime.getTime() + 20 * 60 * 1000), durationMinutes: 40, roomId: 'room_a' },
  ]);
  assert.strictEqual(result.hasConflict, true);
});

test('Finalization Pre-Flight: Blocks completion if matches unverified', () => {
  const audit = auditTournamentFinalization({
    totalMatches: 4,
    completedMatches: 3,
    verifiedResults: 2,
    openDisputesCount: 0,
    activeTeamsCount: 16,
  });
  assert.strictEqual(audit.canFinalize, false);
});

test('Finalization Pre-Flight: Passes when 100% matches completed & verified with 0 disputes', () => {
  const audit = auditTournamentFinalization({
    totalMatches: 4,
    completedMatches: 4,
    verifiedResults: 4,
    openDisputesCount: 0,
    activeTeamsCount: 16,
  });
  assert.strictEqual(audit.canFinalize, true);
});

console.log(`\n========================================`);
console.log(`Total Tests: ${passedTests + failedTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log(`========================================\n`);

if (failedTests > 0) {
  process.exit(1);
}
