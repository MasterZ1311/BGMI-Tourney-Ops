import { db } from './db';
import { SEED_TEAMS_DATA, SEED_GROUPS_DATA } from '../prisma/seed-data';
import { BGIS_10_POINT_SYSTEM } from './scoring/presets';
import { calculateSingleTeamScore } from './scoring/engine';
import type { Tournament } from '@prisma/client';

export const DEMO_TOURNAMENT_ID = 'demo_bgmi_pro_invitational_2026';

export async function seedDemoTournament(options?: { forceReset?: boolean }): Promise<Tournament> {
  if (options?.forceReset) {
    return resetDemoTournament();
  }

  // Check if already exists for idempotency
  const existing = await db.tournament.findUnique({
    where: { id: DEMO_TOURNAMENT_ID },
  });

  if (existing) {
    return existing;
  }

  const now = new Date();
  const startDate = new Date(now.getTime() - 2 * 60 * 60 * 1000); // started 2h ago
  const endDate = new Date(now.getTime() + 6 * 60 * 60 * 1000); // ends in 6h

  // 1. Create Tournament with Settings & Scoring Rule
  const tournament = await db.tournament.create({
    data: {
      id: DEMO_TOURNAMENT_ID,
      name: 'BGMI Pro Invitational 2026',
      organizer: 'Krafton Community Esports',
      description: 'Official Tier-1 Invitational Battlegrounds Mobile India Championship featuring 16 elite squads.',
      format: 'GROUPS_AND_FINALS',
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

  // 2. Create 4 Groups (Group A, B, C, D)
  const groupRecords: Record<string, string> = {};
  for (const grp of SEED_GROUPS_DATA) {
    const createdGroup = await db.group.create({
      data: {
        tournamentId: tournament.id,
        name: grp.name,
        isLocked: true,
      },
    });
    groupRecords[grp.name] = createdGroup.id;
  }

  // 3. Create Teams and Rosters with Group Distribution
  const createdTeams: Array<{ id: string; name: string; tag: string; groupName: string }> = [];

  for (let i = 0; i < SEED_TEAMS_DATA.length; i++) {
    const raw = SEED_TEAMS_DATA[i];

    // Find assigned group
    const assignedGroupDef = SEED_GROUPS_DATA.find((g) => g.teamIndices.includes(i)) || SEED_GROUPS_DATA[0];
    const assignedGroupId = groupRecords[assignedGroupDef.name];

    const team = await db.team.create({
      data: {
        tournamentId: tournament.id,
        groupId: assignedGroupId,
        name: raw.name,
        tag: raw.tag,
        captainName: raw.captainName,
        captainPhone: raw.captainPhone,
        captainEmail: raw.captainEmail,
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
    createdTeams.push({ id: team.id, name: team.name, tag: team.tag, groupName: assignedGroupDef.name });

    // Mark attendance (Reckoning arrived late to mandatory briefing)
    const attendanceStatus = raw.tag === 'REC' ? 'LATE' : 'PRESENT';
    await db.attendance.create({
      data: {
        tournamentId: tournament.id,
        teamId: team.id,
        status: attendanceStatus,
        checkedInBy: 'Chief Marshal',
      },
    });
  }

  // 4. Create 6 Matches across Erangel, Miramar, Sanhok, Vikendi
  const matchConfigs = [
    {
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
        roomName: 'BGMI-INV-R01',
        roomId: '8392019',
        password: 'bgmi@match1',
        status: 'CLOSED',
      },
    },
    {
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
        roomName: 'BGMI-INV-R02',
        roomId: '8392020',
        password: 'bgmi@match2',
        status: 'CLOSED',
      },
    },
    {
      matchNumber: 3,
      title: 'Match #3 - Sanhok (Day 1)',
      map: 'SANHOK',
      perspective: 'TPP',
      scheduledStartTime: new Date(now.getTime() - 5 * 60 * 1000),
      actualStartTime: new Date(now.getTime() - 3 * 60 * 1000),
      actualEndTime: null,
      status: 'LIVE',
      resultStatus: 'DRAFT',
      room: {
        roomName: 'BGMI-INV-R03',
        roomId: '8392021',
        password: 'bgmi@match3',
        status: 'LIVE',
      },
    },
    {
      matchNumber: 4,
      title: 'Match #4 - Vikendi (Day 1 Finals)',
      map: 'VIKENDI',
      perspective: 'TPP',
      scheduledStartTime: new Date(now.getTime() + 40 * 60 * 1000),
      actualStartTime: null,
      actualEndTime: null,
      status: 'SCHEDULED',
      resultStatus: 'DRAFT',
      room: {
        roomName: 'BGMI-INV-R04',
        roomId: '8392022',
        password: 'bgmi@match4',
        status: 'READY',
      },
    },
    {
      matchNumber: 5,
      title: 'Match #5 - Erangel (Day 2 Showdown)',
      map: 'ERANGEL',
      perspective: 'TPP',
      scheduledStartTime: new Date(now.getTime() + 90 * 60 * 1000),
      actualStartTime: null,
      actualEndTime: null,
      status: 'SCHEDULED',
      resultStatus: 'DRAFT',
      room: {
        roomName: 'BGMI-INV-R05',
        roomId: '8392023',
        password: 'bgmi@match5',
        status: 'NOT_CREATED',
      },
    },
    {
      matchNumber: 6,
      title: 'Match #6 - Miramar (Grand Finale)',
      map: 'MIRAMAR',
      perspective: 'TPP',
      scheduledStartTime: new Date(now.getTime() + 140 * 60 * 1000),
      actualStartTime: null,
      actualEndTime: null,
      status: 'SCHEDULED',
      resultStatus: 'DRAFT',
      room: {
        roomName: 'BGMI-INV-R06',
        roomId: '8392024',
        password: 'bgmi@match6',
        status: 'NOT_CREATED',
      },
    },
  ];

  const createdMatches = [];

  for (const cfg of matchConfigs) {
    const m = await db.match.create({
      data: {
        tournamentId: tournament.id,
        matchNumber: cfg.matchNumber,
        title: cfg.title,
        map: cfg.map,
        perspective: cfg.perspective,
        scheduledStartTime: cfg.scheduledStartTime,
        actualStartTime: cfg.actualStartTime,
        actualEndTime: cfg.actualEndTime,
        status: cfg.status,
        resultStatus: cfg.resultStatus,
        room: {
          create: {
            roomName: cfg.room.roomName,
            roomId: cfg.room.roomId,
            password: cfg.room.password,
            status: cfg.room.status,
          },
        },
      },
    });
    createdMatches.push(m);

    // Create MatchTeam slots (1 through 16) for all participating squads
    for (let slot = 0; slot < createdTeams.length; slot++) {
      await db.matchTeam.create({
        data: {
          matchId: m.id,
          teamId: createdTeams[slot].id,
          slotNumber: slot + 1,
        },
      });
    }
  }

  // 5. Populate Official Match Scores for Match 1 & Match 2
  // Match 1 Rankings & Eliminations
  const m1Rankings = [
    { teamIdx: 0, rank: 1, kills: 11 }, // Team SouL (WWCD)
    { teamIdx: 1, rank: 2, kills: 7 },  // GodLike Esports
    { teamIdx: 2, rank: 3, kills: 5 },  // Team XSpark
    { teamIdx: 3, rank: 4, kills: 4 },  // Global Esports
    { teamIdx: 4, rank: 5, kills: 6 },  // Carnival Gaming
    { teamIdx: 5, rank: 6, kills: 3 },  // Revenant Esports
    { teamIdx: 6, rank: 7, kills: 2 },  // Entity Gaming
    { teamIdx: 7, rank: 8, kills: 3 },  // Gods Reign
    { teamIdx: 8, rank: 9, kills: 1 },  // Orangutan
    { teamIdx: 9, rank: 10, kills: 2 }, // Reckoning Esports
    { teamIdx: 10, rank: 11, kills: 1 },// Medal Esports
    { teamIdx: 11, rank: 12, kills: 0 },// Gujarat Tigers
    { teamIdx: 12, rank: 13, kills: 1 },// Blind Esports
    { teamIdx: 13, rank: 14, kills: 0 },// Team 8Bit
    { teamIdx: 14, rank: 15, kills: 0 },// Hydra Official
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
        matchId: createdMatches[0].id,
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

  // Match 2 Rankings & Eliminations
  const m2Rankings = [
    { teamIdx: 2, rank: 1, kills: 9 },  // Team XSpark (WWCD)
    { teamIdx: 4, rank: 2, kills: 8 },  // Carnival Gaming
    { teamIdx: 0, rank: 3, kills: 6 },  // Team SouL
    { teamIdx: 8, rank: 4, kills: 7 },  // Orangutan
    { teamIdx: 1, rank: 5, kills: 4 },  // GodLike Esports
    { teamIdx: 5, rank: 6, kills: 5 },  // Revenant Esports
    { teamIdx: 9, rank: 7, kills: 3 },  // Reckoning Esports
    { teamIdx: 7, rank: 8, kills: 2 },  // Gods Reign
    { teamIdx: 3, rank: 9, kills: 2 },  // Global Esports
    { teamIdx: 6, rank: 10, kills: 1 }, // Entity Gaming
    { teamIdx: 11, rank: 11, kills: 2 },// Gujarat Tigers
    { teamIdx: 10, rank: 12, kills: 0 },// Medal Esports
    { teamIdx: 13, rank: 13, kills: 1 },// Team 8Bit
    { teamIdx: 12, rank: 14, kills: 0 },// Blind Esports
    { teamIdx: 14, rank: 15, kills: 0 },// Hydra Official
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
        matchId: createdMatches[1].id,
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
      teamId: createdTeams[9].id, // Reckoning Esports
      pointsDeducted: 2.0,
      reason: 'Late arrival to lobby check-in (Rule 4.2)',
      status: 'ACTIVE',
      issuedBy: 'Tournament Admin',
    },
  });

  // 7. Create Disputes (1 Under Review, 1 Resolved)
  await db.dispute.create({
    data: {
      tournamentId: tournament.id,
      teamId: createdTeams[1].id, // GodLike Esports
      matchId: createdMatches[0].id,
      category: 'SCORING',
      description: 'Requesting review of elimination credit during final circle flank against Team SouL in Match 1.',
      status: 'UNDER_REVIEW',
      resolutionNotes: 'Video review in progress by referee team.',
    },
  });

  await db.dispute.create({
    data: {
      tournamentId: tournament.id,
      teamId: createdTeams[4].id, // Carnival Gaming
      matchId: createdMatches[1].id,
      category: 'TECHNICAL',
      description: 'Reported micro-stutter on LAN client during Zone 4 rotation.',
      status: 'RESOLVED',
      resolutionNotes: 'Server logs analyzed: packet flow was optimal (0% loss). Result confirmed.',
      resolvedBy: 'Lead Network Marshal',
    },
  });

  // 8. Add Audit Logs
  await db.auditLog.create({
    data: {
      tournamentId: tournament.id,
      action: 'TOURNAMENT_INITIALIZED',
      entityType: 'Tournament',
      entityId: tournament.id,
      reason: 'Tournament created and seeded with 16 Tier-1 squads across 4 groups.',
    },
  });

  await db.auditLog.create({
    data: {
      tournamentId: tournament.id,
      action: 'MATCH_RESULT_VERIFIED',
      entityType: 'Match',
      entityId: createdMatches[0].id,
      reason: 'Match 1 Erangel scores officially audited and published.',
    },
  });

  await db.auditLog.create({
    data: {
      tournamentId: tournament.id,
      action: 'MATCH_RESULT_VERIFIED',
      entityType: 'Match',
      entityId: createdMatches[1].id,
      reason: 'Match 2 Miramar scores officially audited and published.',
    },
  });

  // 9. Add System Notifications
  await db.notification.create({
    data: {
      tournamentId: tournament.id,
      title: 'Tournament Live: BGMI Pro Invitational 2026',
      message: 'Day 1 is underway! Match 1 and Match 2 results are officially published.',
      type: 'SUCCESS',
      isRead: false,
    },
  });

  return tournament;
}

export async function resetDemoTournament(): Promise<Tournament> {
  const existing = await db.tournament.findUnique({
    where: { id: DEMO_TOURNAMENT_ID },
  });

  if (existing) {
    // Delete in sequence or cascade to ensure pristine reset
    await db.teamMatchScore.deleteMany({ where: { match: { tournamentId: DEMO_TOURNAMENT_ID } } });
    await db.matchTeam.deleteMany({ where: { match: { tournamentId: DEMO_TOURNAMENT_ID } } });
    await db.room.deleteMany({ where: { match: { tournamentId: DEMO_TOURNAMENT_ID } } });
    await db.penalty.deleteMany({ where: { tournamentId: DEMO_TOURNAMENT_ID } });
    await db.dispute.deleteMany({ where: { tournamentId: DEMO_TOURNAMENT_ID } });
    await db.attendance.deleteMany({ where: { tournamentId: DEMO_TOURNAMENT_ID } });
    await db.player.deleteMany({ where: { team: { tournamentId: DEMO_TOURNAMENT_ID } } });
    await db.match.deleteMany({ where: { tournamentId: DEMO_TOURNAMENT_ID } });
    await db.team.deleteMany({ where: { tournamentId: DEMO_TOURNAMENT_ID } });
    await db.group.deleteMany({ where: { tournamentId: DEMO_TOURNAMENT_ID } });
    await db.scoringRule.deleteMany({ where: { tournamentId: DEMO_TOURNAMENT_ID } });
    await db.tournamentSettings.deleteMany({ where: { tournamentId: DEMO_TOURNAMENT_ID } });
    await db.auditLog.deleteMany({ where: { tournamentId: DEMO_TOURNAMENT_ID } });
    await db.notification.deleteMany({ where: { tournamentId: DEMO_TOURNAMENT_ID } });

    await db.tournament.delete({
      where: { id: DEMO_TOURNAMENT_ID },
    });
  }

  return seedDemoTournament();
}
