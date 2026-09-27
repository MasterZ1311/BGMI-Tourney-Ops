import { db } from './db';
import { SEED_TEAMS_DATA } from '../prisma/seed-data';
import { BGIS_10_POINT_SYSTEM } from './scoring/presets';
import { calculateSingleTeamScore } from './scoring/engine';

export const DEMO_TOURNAMENT_ID = 'demo_bgmi_pro_invitational_2026';

export async function seedDemoTournament() {
  // Check if already exists
  const existing = await db.tournament.findUnique({
    where: { id: DEMO_TOURNAMENT_ID },
  });

  if (existing) {
    return existing;
  }

  const now = new Date();
  const startDate = new Date(now.getTime() - 2 * 60 * 60 * 1000); // started 2h ago
  const endDate = new Date(now.getTime() + 4 * 60 * 60 * 1000); // ends in 4h

  // 1. Create Tournament
  const tournament = await db.tournament.create({
    data: {
      id: DEMO_TOURNAMENT_ID,
      name: 'BGMI Pro Invitational 2026',
      organizer: 'Krafton Community Esports',
      description: 'Official Tier-1 Invitational Battlegrounds Mobile India Championship featuring 16 elite squads.',
      format: 'GROUP_STAGE',
      status: 'LIVE',
      startDate,
      endDate,
      venue: 'Sathyabama Indoor Arena / Online LAN Hybrid',
      contactEmail: 'tournaments@krafton-bgmi.esports',
      settings: {
        create: {
          totalTeamsCap: 16,
          squadSize: 4,
          substitutesCap: 2,
          maxTeamsPerGroup: 16,
          matchDurationMinutes: 30,
          breakDurationMinutes: 15,
          noShowGraceMinutes: 10,
          disputeWindowMinutes: 15,
          allowSubstitutions: true,
          rulesMarkdown: '# Official BGMI Ruleset\n1. No emulators allowed.\n2. In-game names must match roster submission.\n3. Disconnects within 60s warrant lobby remake if <= 2 teams impacted.',
        },
      },
      scoringRule: {
        create: {
          name: BGIS_10_POINT_SYSTEM.name,
          placementPoints: JSON.stringify(BGIS_10_POINT_SYSTEM.placementPoints),
          killPointsPerElim: BGIS_10_POINT_SYSTEM.killPointsPerElim,
          wwcdBonus: BGIS_10_POINT_SYSTEM.wwcdBonus,
          tieBreakers: JSON.stringify(BGIS_10_POINT_SYSTEM.tieBreakers),
        },
      },
    },
  });

  // 2. Create Groups
  const groupA = await db.group.create({
    data: {
      tournamentId: tournament.id,
      name: 'Group A (Championship Lobby)',
      isLocked: true,
    },
  });

  // 3. Create Teams and Rosters
  const createdTeams: Array<{ id: string; name: string; tag: string }> = [];

  for (let i = 0; i < SEED_TEAMS_DATA.length; i++) {
    const raw = SEED_TEAMS_DATA[i];
    const team = await db.team.create({
      data: {
        tournamentId: tournament.id,
        groupId: groupA.id,
        name: raw.name,
        tag: raw.tag,
        captainName: raw.captainName,
        verificationStatus: 'VERIFIED',
        status: 'ACTIVE',
        players: {
          create: raw.players.map((p) => ({
            name: p.name,
            ign: p.ign,
            characterId: p.characterId,
            role: p.role,
            isSubstitute: p.isSubstitute,
            isVerified: true,
          })),
        },
      },
    });
    createdTeams.push({ id: team.id, name: team.name, tag: team.tag });

    // Mark attendance
    const attendanceStatus = i === 14 ? 'LATE' : i === 15 ? 'ABSENT' : 'PRESENT';
    await db.attendance.create({
      data: {
        tournamentId: tournament.id,
        teamId: team.id,
        status: attendanceStatus,
        checkedInBy: 'Chief Marshal',
      },
    });
  }

  // 4. Create Matches
  // Match 1: Completed & Verified (Erangel)
  const match1 = await db.match.create({
    data: {
      tournamentId: tournament.id,
      groupId: groupA.id,
      matchNumber: 1,
      title: 'Match #1 - Erangel (Day 1)',
      map: 'ERANGEL',
      perspective: 'TPP',
      scheduledStartTime: new Date(now.getTime() - 90 * 60 * 1000),
      actualStartTime: new Date(now.getTime() - 88 * 60 * 1000),
      actualEndTime: new Date(now.getTime() - 58 * 60 * 1000),
      status: 'VERIFIED',
      resultStatus: 'PUBLISHED',
      room: {
        create: {
          roomName: 'BGMI-INV-R01',
          roomId: '8392019',
          password: 'bgmi@match1',
          status: 'CLOSED',
        },
      },
    },
  });

  // Match 2: Completed & Verified (Miramar)
  const match2 = await db.match.create({
    data: {
      tournamentId: tournament.id,
      groupId: groupA.id,
      matchNumber: 2,
      title: 'Match #2 - Miramar (Day 1)',
      map: 'MIRAMAR',
      perspective: 'TPP',
      scheduledStartTime: new Date(now.getTime() - 45 * 60 * 1000),
      actualStartTime: new Date(now.getTime() - 43 * 60 * 1000),
      actualEndTime: new Date(now.getTime() - 15 * 60 * 1000),
      status: 'VERIFIED',
      resultStatus: 'PUBLISHED',
      room: {
        create: {
          roomName: 'BGMI-INV-R02',
          roomId: '8392020',
          password: 'bgmi@match2',
          status: 'CLOSED',
        },
      },
    },
  });

  // Match 3: Currently LIVE (Sanhok)
  const match3 = await db.match.create({
    data: {
      tournamentId: tournament.id,
      groupId: groupA.id,
      matchNumber: 3,
      title: 'Match #3 - Sanhok (Day 1)',
      map: 'SANHOK',
      perspective: 'TPP',
      scheduledStartTime: new Date(now.getTime() - 5 * 60 * 1000),
      actualStartTime: new Date(now.getTime() - 3 * 60 * 1000),
      status: 'LIVE',
      resultStatus: 'DRAFT',
      room: {
        create: {
          roomName: 'BGMI-INV-R03',
          roomId: '8392021',
          password: 'bgmi@match3',
          status: 'LIVE',
        },
      },
    },
  });

  // Match 4: SCHEDULED (Vikendi)
  await db.match.create({
    data: {
      tournamentId: tournament.id,
      groupId: groupA.id,
      matchNumber: 4,
      title: 'Match #4 - Vikendi (Day 1 Finals)',
      map: 'VIKENDI',
      perspective: 'TPP',
      scheduledStartTime: new Date(now.getTime() + 40 * 60 * 1000),
      status: 'SCHEDULED',
      resultStatus: 'DRAFT',
      room: {
        create: {
          roomName: 'BGMI-INV-R04',
          roomId: '8392022',
          password: 'bgmi@match4',
          status: 'READY',
        },
      },
    },
  });

  // 5. Populate Scores for Match 1 & Match 2
  // Realistic BGMI distribution:
  // Match 1: Team SouL (WWCD, 11 kills), GodLike (2nd, 7 kills), XSpark (3rd, 5 kills), Global Esports (4th, 4 kills)...
  const m1Rankings = [
    { teamIdx: 0, rank: 1, kills: 11 }, // Team SouL
    { teamIdx: 1, rank: 2, kills: 7 },  // GodLike
    { teamIdx: 2, rank: 3, kills: 5 },  // XSpark
    { teamIdx: 3, rank: 4, kills: 4 },  // Global Esports
    { teamIdx: 4, rank: 5, kills: 6 },  // Carnival
    { teamIdx: 5, rank: 6, kills: 3 },  // Revenant
    { teamIdx: 6, rank: 7, kills: 2 },  // Entity
    { teamIdx: 7, rank: 8, kills: 3 },  // Gods Reign
    { teamIdx: 8, rank: 9, kills: 1 },  // Orangutan
    { teamIdx: 9, rank: 10, kills: 2 }, // Reckoning
    { teamIdx: 10, rank: 11, kills: 1 },// Medal
    { teamIdx: 11, rank: 12, kills: 0 },// Gujarat Tigers
    { teamIdx: 12, rank: 13, kills: 1 },// Blind
    { teamIdx: 13, rank: 14, kills: 0 },// 8Bit
    { teamIdx: 14, rank: 15, kills: 0 },// Hydra
    { teamIdx: 15, rank: 16, kills: 0 },// Team Forever
  ];

  for (const row of m1Rankings) {
    const team = createdTeams[row.teamIdx];
    const calc = calculateSingleTeamScore(
      { teamId: team.id, placement: row.rank, kills: row.kills },
      BGIS_10_POINT_SYSTEM
    );
    await db.teamMatchScore.create({
      data: {
        matchId: match1.id,
        teamId: team.id,
        placement: calc.placement,
        kills: calc.kills,
        placementPoints: calc.placementPoints,
        killPoints: calc.killPoints,
        bonusPoints: calc.bonusPoints,
        penaltyPoints: calc.penaltyPoints,
        totalPoints: calc.totalPoints,
        isWwcd: calc.isWwcd,
      },
    });
  }

  // Match 2: Team XSpark (WWCD, 9 kills), Carnival (2nd, 8 kills), Team SouL (3rd, 6 kills)...
  const m2Rankings = [
    { teamIdx: 2, rank: 1, kills: 9 },  // XSpark
    { teamIdx: 4, rank: 2, kills: 8 },  // Carnival
    { teamIdx: 0, rank: 3, kills: 6 },  // SouL
    { teamIdx: 8, rank: 4, kills: 7 },  // Orangutan
    { teamIdx: 1, rank: 5, kills: 4 },  // GodLike
    { teamIdx: 5, rank: 6, kills: 5 },  // Revenant
    { teamIdx: 9, rank: 7, kills: 3 },  // Reckoning
    { teamIdx: 7, rank: 8, kills: 2 },  // Gods Reign
    { teamIdx: 3, rank: 9, kills: 2 },  // Global Esports
    { teamIdx: 6, rank: 10, kills: 1 }, // Entity
    { teamIdx: 11, rank: 11, kills: 2 },// Gujarat Tigers
    { teamIdx: 10, rank: 12, kills: 0 },// Medal
    { teamIdx: 13, rank: 13, kills: 1 },// 8Bit
    { teamIdx: 12, rank: 14, kills: 0 },// Blind
    { teamIdx: 14, rank: 15, kills: 0 },// Hydra
    { teamIdx: 15, rank: 16, kills: 0 },// Team Forever
  ];

  for (const row of m2Rankings) {
    const team = createdTeams[row.teamIdx];
    const calc = calculateSingleTeamScore(
      { teamId: team.id, placement: row.rank, kills: row.kills },
      BGIS_10_POINT_SYSTEM
    );
    await db.teamMatchScore.create({
      data: {
        matchId: match2.id,
        teamId: team.id,
        placement: calc.placement,
        kills: calc.kills,
        placementPoints: calc.placementPoints,
        killPoints: calc.killPoints,
        bonusPoints: calc.bonusPoints,
        penaltyPoints: calc.penaltyPoints,
        totalPoints: calc.totalPoints,
        isWwcd: calc.isWwcd,
      },
    });
  }

  // 6. Create Penalty for Reckoning Esports
  await db.penalty.create({
    data: {
      tournamentId: tournament.id,
      teamId: createdTeams[9].id, // Reckoning
      pointsDeducted: 2.0,
      reason: 'Late arrival to lobby check-in (Rule 4.2)',
      status: 'ACTIVE',
      issuedBy: 'Tournament Admin',
    },
  });

  // 7. Create Dispute
  await db.dispute.create({
    data: {
      tournamentId: tournament.id,
      teamId: createdTeams[1].id, // GodLike
      category: 'SCORING',
      description: 'Requesting review of elimination credit during final circle flank against Team SouL in Match 1.',
      status: 'UNDER_REVIEW',
      resolutionNotes: 'Video review in progress by referee team.',
    },
  });

  // 8. Add Audit Log
  await db.auditLog.create({
    data: {
      tournamentId: tournament.id,
      action: 'TOURNAMENT_INITIALIZED',
      entityType: 'Tournament',
      entityId: tournament.id,
      reason: 'Tournament created and seeded with 16 Tier-1 squads.',
    },
  });

  return tournament;
}

export async function resetDemoTournament() {
  const existing = await db.tournament.findUnique({
    where: { id: DEMO_TOURNAMENT_ID },
  });

  if (existing) {
    await db.tournament.delete({
      where: { id: DEMO_TOURNAMENT_ID },
    });
  }

  return seedDemoTournament();
}
