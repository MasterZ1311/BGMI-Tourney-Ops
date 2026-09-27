import { describe, it, expect } from 'vitest';
import {
  TournamentCreateSchema,
  TeamCreateSchema,
  MatchResultSubmissionSchema,
  RoomUpdateSchema,
  AttendanceMarkSchema,
  PenaltyCreateSchema,
  DisputeCreateSchema,
} from '../lib/validation/schemas';
import {
  generateBalancedGroups,
  generateMatchSchedule,
  detectMatchConflicts,
  validateTournamentTransition,
  validateMatchTransition,
  auditTournamentFinalization,
} from '../lib/tournament/engine';
import {
  calculateMatchScores,
  calculateTournamentLeaderboard,
  validateMatchScoreInputs,
} from '../lib/scoring/engine';
import { BGIS_10_POINT_SYSTEM } from '../lib/scoring/presets';
import { checkPermission } from '../lib/auth/roles';
import { RawTeamMatchInput } from '../lib/scoring/types';

describe('BGMI End-to-End Tournament Director Operational Workflow', () => {
  it('should successfully execute the complete 14-step tournament operations lifecycle', () => {
    // -------------------------------------------------------------------------
    // STEP 1: Tournament Creation with Official BGIS 10-Point Rule Preset
    // -------------------------------------------------------------------------
    const tournamentPayload = {
      name: 'BGMI National Championship 2026',
      organizer: 'Krafton India Esports',
      format: 'GROUPS_AND_FINALS' as const,
      startDate: '2026-10-10T10:00:00.000Z',
      endDate: '2026-10-12T20:00:00.000Z',
      settings: {
        totalTeamsCap: 16,
        squadSize: 4,
        substitutesCap: 1,
        maxTeamsPerGroup: 4,
        matchDurationMinutes: 30,
        breakDurationMinutes: 10,
      },
    };

    const tourneyValidation = TournamentCreateSchema.safeParse(tournamentPayload);
    expect(tourneyValidation.success).toBe(true);
    const tournamentId = 'tourney_e2e_2026';

    // -------------------------------------------------------------------------
    // STEP 2: Register 16 Squads with 4 Starters + 1 Substitute Each
    // -------------------------------------------------------------------------
    const teamNames = [
      'Team Soul', 'GodLike Esports', 'Global Esports', 'Revenant Esports',
      'Team XSpark', 'Orangutan', 'Blind Esports', 'Entity Gaming',
      'Medal Esports', 'Hydra Official', 'Gladiators Esports', 'Team 8Bit',
      'Gujarat Tigers', 'Autobotz Esports', 'Team Insane', 'Big Brother Esports',
    ];

    const registeredTeams = teamNames.map((name, idx) => {
      const tag = name.substring(0, 4).toUpperCase().replace(/\s/g, 'X');
      const teamData = {
        name,
        tag: tag.length < 2 ? 'TM' : tag.slice(0, 5),
        captainName: `Captain ${idx + 1}`,
        captainPhone: `+9198000000${String(idx).padStart(2, '0')}`,
        captainEmail: `lead${idx + 1}@esports.in`,
        players: [
          { name: `P1_${idx}`, ign: `IGN1_${idx}`, characterId: `51000000${String(idx * 5 + 1).padStart(2, '0')}`, role: 'CAPTAIN' as const, isSubstitute: false },
          { name: `P2_${idx}`, ign: `IGN2_${idx}`, characterId: `51000000${String(idx * 5 + 2).padStart(2, '0')}`, role: 'ASSAULTER' as const, isSubstitute: false },
          { name: `P3_${idx}`, ign: `IGN3_${idx}`, characterId: `51000000${String(idx * 5 + 3).padStart(2, '0')}`, role: 'SUPPORT' as const, isSubstitute: false },
          { name: `P4_${idx}`, ign: `IGN4_${idx}`, characterId: `51000000${String(idx * 5 + 4).padStart(2, '0')}`, role: 'IGL' as const, isSubstitute: false },
          { name: `P5_${idx}`, ign: `IGN5_${idx}`, characterId: `51000000${String(idx * 5 + 5).padStart(2, '0')}`, role: 'ASSAULTER' as const, isSubstitute: true },
        ],
      };

      const parseResult = TeamCreateSchema.safeParse(teamData);
      expect(parseResult.success).toBe(true);

      return {
        id: `team_${idx + 1}`,
        name: teamData.name,
        tag: teamData.tag,
      };
    });

    expect(registeredTeams.length).toBe(16);

    // -------------------------------------------------------------------------
    // STEP 3: Distribute Squads into 4 Balanced Groups (4 squads each)
    // -------------------------------------------------------------------------
    const groups = generateBalancedGroups({
      tournamentId,
      groupCount: 4,
      teams: registeredTeams,
      seed: 4242,
    });

    expect(groups.length).toBe(4);
    for (const g of groups) {
      expect(g.teams.length).toBe(4);
    }

    // -------------------------------------------------------------------------
    // STEP 4: Lock Groups & Transition Tournament State to GROUPS_LOCKED
    // -------------------------------------------------------------------------
    const lockTransition = validateTournamentTransition('CHECK_IN', 'GROUPS_LOCKED', {
      groupsConfigured: true,
    });
    expect(lockTransition.valid).toBe(true);

    // -------------------------------------------------------------------------
    // STEP 5: Generate Timetable for 4 Matches with Rotating Maps
    // -------------------------------------------------------------------------
    const scheduleStartTime = new Date('2026-10-10T14:00:00.000Z');
    const matchSlots = generateMatchSchedule({
      tournamentId,
      matchCount: 4,
      startTime: scheduleStartTime,
      matchDurationMinutes: 30,
      breakDurationMinutes: 10,
      maps: ['ERANGEL', 'MIRAMAR', 'SANHOK', 'VIKENDI'],
    });

    expect(matchSlots.length).toBe(4);
    expect(matchSlots[0].map).toBe('ERANGEL');
    expect(matchSlots[1].map).toBe('MIRAMAR');

    // -------------------------------------------------------------------------
    // STEP 6: Verify 0 Scheduling Conflicts
    // -------------------------------------------------------------------------
    const conflictAudit = detectMatchConflicts(
      matchSlots.map((s, idx) => ({
        id: `match_${idx + 1}`,
        matchNumber: s.matchNumber,
        scheduledStartTime: s.scheduledStartTime,
        durationMinutes: 30,
        roomId: `room_${idx + 1}`,
      }))
    );
    expect(conflictAudit.hasConflict).toBe(false);

    // -------------------------------------------------------------------------
    // STEP 7: Room Credential Delivery & RBAC Masking Guard
    // -------------------------------------------------------------------------
    const roomPayload = {
      roomId: '9922001',
      password: 'championship_pw',
      status: 'READY' as const,
    };
    expect(RoomUpdateSchema.safeParse(roomPayload).success).toBe(true);
    // RBAC: OBSERVER cannot see room password; MATCH_ADMIN can
    expect(checkPermission('OBSERVER', 'canSeeRoomPasswords')).toBe(false);
    expect(checkPermission('MATCH_ADMIN', 'canSeeRoomPasswords')).toBe(true);

    // -------------------------------------------------------------------------
    // STEP 8: Squad Attendance Check-In
    // -------------------------------------------------------------------------
    for (const team of registeredTeams) {
      const attendance = AttendanceMarkSchema.safeParse({
        teamId: team.id,
        matchId: 'match_1',
        status: 'PRESENT' as const,
        checkedInBy: 'Lobby Marshal 1',
      });
      expect(attendance.success).toBe(true);
    }

    // -------------------------------------------------------------------------
    // STEP 9: Transition Match #1 Operational Status to LIVE
    // -------------------------------------------------------------------------
    expect(validateMatchTransition('SCHEDULED', 'READY').valid).toBe(true);
    expect(validateMatchTransition('READY', 'OPEN').valid).toBe(true);
    expect(validateMatchTransition('OPEN', 'LIVE').valid).toBe(true);

    // -------------------------------------------------------------------------
    // STEP 10: Submit Match #1 Score Sheet (16 Placements & Kills)
    // -------------------------------------------------------------------------
    // Team 1 gets WWCD (rank 1) with 10 kills. Team 2 gets 2nd with 6 kills, etc.
    const rawScores: RawTeamMatchInput[] = registeredTeams.map((t, idx) => ({
      teamId: t.id,
      placement: idx + 1,
      kills: Math.max(0, 16 - idx * 2),
      bonusPoints: 0,
      penaltyPoints: 0,
    }));

    const scoreInputValidation = validateMatchScoreInputs(rawScores, 16);
    expect(scoreInputValidation.isValid).toBe(true);

    const submissionPayload = {
      resultStatus: 'SUBMITTED' as const,
      scores: rawScores,
    };
    expect(MatchResultSubmissionSchema.safeParse(submissionPayload).success).toBe(true);

    const calculatedMatchScores = calculateMatchScores(rawScores, BGIS_10_POINT_SYSTEM);
    expect(calculatedMatchScores[0].teamId).toBe(registeredTeams[0].id);
    expect(calculatedMatchScores[0].isWwcd).toBe(true);
    expect(calculatedMatchScores[0].totalPoints).toBe(26); // 10 placement + 16 kills = 26

    // -------------------------------------------------------------------------
    // STEP 11: Result Verification & Publication
    // -------------------------------------------------------------------------
    // Match goes from LIVE -> COMPLETED -> VERIFIED -> PUBLISHED
    expect(validateMatchTransition('LIVE', 'COMPLETED').valid).toBe(true);
    expect(validateMatchTransition('COMPLETED', 'VERIFIED').valid).toBe(true);
    expect(validateMatchTransition('VERIFIED', 'PUBLISHED').valid).toBe(true);

    // -------------------------------------------------------------------------
    // STEP 12: Aggregate Live Leaderboard
    // -------------------------------------------------------------------------
    const initialLeaderboard = calculateTournamentLeaderboard(
      registeredTeams,
      [
        {
          matchId: 'match_1',
          matchNumber: 1,
          teamScores: calculatedMatchScores,
        },
      ],
      [],
      BGIS_10_POINT_SYSTEM
    );

    expect(initialLeaderboard[0].teamId).toBe(registeredTeams[0].id);
    expect(initialLeaderboard[0].totalPoints).toBe(26);
    expect(initialLeaderboard[0].wwcdCount).toBe(1);

    // -------------------------------------------------------------------------
    // STEP 13: Issue Penalty Deduction & Verify Standings Recalculation
    // -------------------------------------------------------------------------
    const penaltyPayload = {
      teamId: registeredTeams[0].id,
      pointsDeducted: 10,
      reason: 'Illegal substitution mid-match',
    };
    expect(PenaltyCreateSchema.safeParse(penaltyPayload).success).toBe(true);

    const updatedLeaderboard = calculateTournamentLeaderboard(
      registeredTeams,
      [
        {
          matchId: 'match_1',
          matchNumber: 1,
          teamScores: calculatedMatchScores,
        },
      ],
      [{ teamId: registeredTeams[0].id, pointsDeducted: 10, status: 'ACTIVE' }],
      BGIS_10_POINT_SYSTEM
    );

    // Team 1 score reduced: 26 - 10 = 16 pts
    const team1Standing = updatedLeaderboard.find((s) => s.teamId === registeredTeams[0].id);
    expect(team1Standing?.totalPoints).toBe(16);
    expect(team1Standing?.penaltyPoints).toBe(10);

    // -------------------------------------------------------------------------
    // STEP 14: Dispute Adjudication & Pre-Flight Finalization Audit
    // -------------------------------------------------------------------------
    // Team 2 files a dispute
    const disputePayload = {
      teamId: registeredTeams[1].id,
      category: 'SCORING' as const,
      description: 'Kill point discrepancy on final circle elimination',
    };
    expect(DisputeCreateSchema.safeParse(disputePayload).success).toBe(true);

    // Audit fails when dispute is open
    const preFlightBlocked = auditTournamentFinalization({
      totalMatches: 1,
      completedMatches: 1,
      verifiedResults: 1,
      openDisputesCount: 1, // Open!
      activeTeamsCount: 16,
    });
    expect(preFlightBlocked.canFinalize).toBe(false);

    // Admin resolves dispute -> Audit passes
    const preFlightPassed = auditTournamentFinalization({
      totalMatches: 1,
      completedMatches: 1,
      verifiedResults: 1,
      openDisputesCount: 0, // Resolved!
      activeTeamsCount: 16,
    });
    expect(preFlightPassed.canFinalize).toBe(true);

    // Tournament transitions from RESULTS_REVIEW -> COMPLETED
    const finalizationTransition = validateTournamentTransition('RESULTS_REVIEW', 'COMPLETED', {
      auditResult: preFlightPassed,
    });
    expect(finalizationTransition.valid).toBe(true);
  });
});
