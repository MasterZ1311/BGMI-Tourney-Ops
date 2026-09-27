import { db } from '../lib/db';
import { seedDemoTournament } from '../lib/seed-service';
import { GET as getTournaments, POST as createTournament } from '../app/api/tournaments/route';
import { GET as getTournament, PATCH as patchTournament } from '../app/api/tournaments/[id]/route';
import { GET as getTeams, POST as createTeam } from '../app/api/tournaments/[id]/teams/route';
import { GET as getGroups, POST as createGroup } from '../app/api/tournaments/[id]/groups/route';
import { PATCH as patchGroup } from '../app/api/groups/[id]/route';
import { GET as getMatches, POST as createMatch } from '../app/api/tournaments/[id]/matches/route';
import { GET as getMatch, PATCH as patchMatch } from '../app/api/matches/[id]/route';
import { GET as getRoom, PUT as putRoom } from '../app/api/matches/[id]/room/route';
import { GET as getResults, POST as postResults } from '../app/api/matches/[id]/results/route';
import { POST as verifyMatch } from '../app/api/matches/[id]/verify/route';
import { POST as publishMatch } from '../app/api/matches/[id]/publish/route';
import { GET as getLeaderboard } from '../app/api/tournaments/[id]/leaderboard/route';
import { GET as getPenalties, POST as postPenalty } from '../app/api/tournaments/[id]/penalties/route';
import { PATCH as patchPenalty } from '../app/api/penalties/[id]/route';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName} - ${detail || 'Assertion failed'}`);
    failed++;
  }
}

async function run() {
  console.log('========================================================');
  console.log('  AGENT 3: BACKEND API & CONTROLLERS VERIFICATION');
  console.log('========================================================\n');

  // Seed demo tournament
  const tournament = await seedDemoTournament();
  const tId = tournament.id;

  // ----------------------------------------------------
  // Test 1: Standard Success Envelope
  // ----------------------------------------------------
  console.log('>>> 1. RESPONSE ENVELOPES & STATUS CODES');
  const tourneyRes = await getTournament(
    new Request(`http://localhost:3000/api/tournaments/${tId}`),
    { params: { id: tId } }
  );
  const tourneyJson = await tourneyRes.json();
  assert(tourneyRes.status === 200, 'GET /api/tournaments/:id returns HTTP 200');
  assert(tourneyJson.success === true, 'Success envelope has success: true');
  assert(tourneyJson.data && tourneyJson.data.id === tId, 'Envelope data contains tournament payload');

  // ----------------------------------------------------
  // Test 2: Standard Error Envelope on Validation Error
  // ----------------------------------------------------
  console.log('\n>>> 2. INPUT VALIDATION VIA STRICT ZOD SCHEMAS');
  const invalidTourneyRes = await createTournament(
    new Request('http://localhost:3000/api/tournaments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'x' }), // Name too short, missing organizer, etc.
    })
  );
  const invalidJson = await invalidTourneyRes.json();
  assert(invalidTourneyRes.status === 422, 'Invalid schema returns HTTP 422 Unprocessable Entity');
  assert(invalidJson.success === false, 'Error envelope has success: false');
  assert(invalidJson.error.code === 'VALIDATION_ERROR', 'Error envelope code is VALIDATION_ERROR');
  assert(Array.isArray(invalidJson.error.details) && invalidJson.error.details.length > 0, 'Details contains array of field errors');
  assert(typeof invalidJson.error.timestamp === 'string', 'Error envelope contains ISO timestamp');

  // ----------------------------------------------------
  // Test 3: Roster Conflict Rejection
  // ----------------------------------------------------
  console.log('\n>>> 3. ROSTER DUPLICATE & INTEGRITY DEFENSE');
  const dupTeamRes = await createTeam(
    new Request(`http://localhost:3000/api/tournaments/${tId}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'GodLike Esports', // Already exists in seed
        tag: 'GODL',
      }),
    }),
    { params: { id: tId } }
  );
  const dupTeamJson = await dupTeamRes.json();
  assert(dupTeamRes.status === 409, 'Duplicate team name returns HTTP 409 Conflict');
  assert(dupTeamJson.error.code === 'DUPLICATE_TEAM_NAME', 'Error code is DUPLICATE_TEAM_NAME');

  // Duplicate player character ID check
  const dupPlayerRes = await createTeam(
    new Request(`http://localhost:3000/api/tournaments/${tId}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Dynamic Squad ${Date.now()}`,
        tag: 'DYN9',
        players: [
          { name: 'Player A', ign: 'PlayerA', characterId: '5112233445', role: 'CAPTAIN' }, // Jonathan's UID from seed
        ],
      }),
    }),
    { params: { id: tId } }
  );
  const dupPlayerJson = await dupPlayerRes.json();
  assert(dupPlayerRes.status === 409, 'Duplicate player Character ID returns HTTP 409 Conflict');
  assert(dupPlayerJson.error.code === 'CHARACTER_ID_CONFLICT', 'Error code is CHARACTER_ID_CONFLICT');

  // ----------------------------------------------------
  // Test 4: Room Password Concealment
  // ----------------------------------------------------
  console.log('\n>>> 4. ROOM PASSWORD CONCEALMENT & RBAC');
  const matches = await db.match.findMany({ where: { tournamentId: tId }, include: { room: true } });
  const testMatch = matches[0];

  // Observer request (no password permission)
  const observerRoomRes = await getRoom(
    new Request(`http://localhost:3000/api/matches/${testMatch.id}/room`, {
      headers: { 'x-user-role': 'OBSERVER' },
    }),
    { params: { id: testMatch.id } }
  );
  const observerRoomJson = await observerRoomRes.json();
  assert(observerRoomJson.data.password === '••••••••', 'Observer receives masked room password ("••••••••")');

  // Scorekeeper request (no password permission)
  const scorekeeperRoomRes = await getRoom(
    new Request(`http://localhost:3000/api/matches/${testMatch.id}/room`, {
      headers: { 'x-user-role': 'SCOREKEEPER' },
    }),
    { params: { id: testMatch.id } }
  );
  const scorekeeperRoomJson = await scorekeeperRoomRes.json();
  assert(scorekeeperRoomJson.data.password === '••••••••', 'Scorekeeper receives masked room password ("••••••••")');

  // Unauthenticated / public request (no role header)
  const publicRoomRes = await getRoom(
    new Request(`http://localhost:3000/api/matches/${testMatch.id}/room`),
    { params: { id: testMatch.id } }
  );
  const publicRoomJson = await publicRoomRes.json();
  assert(publicRoomJson.data.password === '••••••••', 'Unauthenticated requester receives masked room password');

  // Match Admin request (has permission)
  const matchAdminRoomRes = await getRoom(
    new Request(`http://localhost:3000/api/matches/${testMatch.id}/room`, {
      headers: { 'x-user-role': 'MATCH_ADMIN' },
    }),
    { params: { id: testMatch.id } }
  );
  const matchAdminRoomJson = await matchAdminRoomRes.json();
  assert(matchAdminRoomJson.data.password !== '••••••••' && !!matchAdminRoomJson.data.password, 'Match Admin receives unmasked room password');

  // ----------------------------------------------------
  // Test 5: Published Match Score Immutability (409 Conflict)
  // ----------------------------------------------------
  console.log('\n>>> 5. PUBLISHED RESULT IMMUTABILITY & 409 CONFLICT');
  // Match #1 is published in demo seed. Verify its status is PUBLISHED
  const m1 = await db.match.findUnique({ where: { id: testMatch.id } });
  assert(m1?.resultStatus === 'PUBLISHED', 'Test match is in PUBLISHED state');

  const teams = await db.team.findMany({ where: { tournamentId: tId }, take: 16 });
  const rawScores = teams.map((team, idx) => ({
    teamId: team.id,
    placement: idx + 1,
    kills: 16 - idx,
    bonusPoints: 0,
    penaltyPoints: 0,
  }));

  // Direct silent edit without admin override
  const silentEditRes = await postResults(
    new Request(`http://localhost:3000/api/matches/${testMatch.id}/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resultStatus: 'SUBMITTED',
        scores: rawScores,
      }),
    }),
    { params: { id: testMatch.id } }
  );
  const silentEditJson = await silentEditRes.json();
  assert(silentEditRes.status === 409, 'Silent edit to PUBLISHED match returns HTTP 409 Conflict');
  assert(silentEditJson.error.code === 'PUBLISHED_LOCKED', 'Error code is PUBLISHED_LOCKED');

  // Explicit admin override with reason
  const overrideRes = await postResults(
    new Request(`http://localhost:3000/api/matches/${testMatch.id}/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resultStatus: 'PUBLISHED',
        scores: rawScores,
        adminOverride: true,
        overrideReason: 'Official referee adjustment after video review',
      }),
    }),
    { params: { id: testMatch.id } }
  );
  const overrideJson = await overrideRes.json();
  assert(overrideRes.status === 200, 'Explicit admin override with reason succeeds on PUBLISHED match');
  assert(overrideJson.success === true, 'Override result returns success: true');

  // ----------------------------------------------------
  // Test 6: Authoritative Leaderboard Delegation
  // ----------------------------------------------------
  console.log('\n>>> 6. LEADERBOARD ENGINE DELEGATION');
  const lbRes = await getLeaderboard(
    new Request(`http://localhost:3000/api/tournaments/${tId}/leaderboard`),
    { params: { id: tId } }
  );
  const lbJson = await lbRes.json();
  assert(lbRes.status === 200, 'GET leaderboard returns HTTP 200');
  assert(lbJson.success === true, 'Leaderboard envelope has success: true');
  assert(Array.isArray(lbJson.data.standings) && lbJson.data.standings.length > 0, 'Standings contains ranked squads');
  assert(lbJson.data.standings[0].rank === 1, 'Top squad has rank 1');
  assert(typeof lbJson.data.standings[0].totalPoints === 'number', 'Total points computed mathematically');

  // ----------------------------------------------------
  // Test 7: Group Membership & Lock Management
  // ----------------------------------------------------
  console.log('\n>>> 7. GROUPS & SEEDING ROUTE CAPABILITIES');
  const groupList = await db.group.findMany({ where: { tournamentId: tId } });
  const targetGroup = groupList[0];
  const patchGroupRes = await patchGroup(
    new Request(`http://localhost:3000/api/groups/${targetGroup.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Group Alpha Prime' }),
    }),
    { params: { id: targetGroup.id } }
  );
  const patchGroupJson = await patchGroupRes.json();
  assert(patchGroupRes.status === 200, 'PATCH /api/groups/:id returns HTTP 200');
  assert(patchGroupJson.data.name === 'Group Alpha Prime', 'Group name successfully updated');

  // ----------------------------------------------------
  // Test 8: Penalty Voiding Route
  // ----------------------------------------------------
  console.log('\n>>> 8. PENALTY WORKFLOW & AUDIT');
  const penList = await db.penalty.findMany({ where: { tournamentId: tId } });
  const targetPen = penList[0];
  const voidPenRes = await patchPenalty(
    new Request(`http://localhost:3000/api/penalties/${targetPen.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Team appeal accepted by Head Referee', status: 'VOIDED' }),
    }),
    { params: { id: targetPen.id } }
  );
  const voidPenJson = await voidPenRes.json();
  assert(voidPenRes.status === 200, 'PATCH /api/penalties/:id returns HTTP 200');
  assert(voidPenJson.data.status === 'VOIDED', 'Penalty status successfully updated to VOIDED');

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log('\n--------------------------------------------------------');
  console.log(`  TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('--------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
