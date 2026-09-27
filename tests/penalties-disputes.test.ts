import { describe, it, expect } from 'vitest';
import { PenaltyCreateSchema, DisputeCreateSchema } from '../lib/validation/schemas';
import { calculateTournamentLeaderboard } from '../lib/scoring/engine';
import { BGIS_10_POINT_SYSTEM } from '../lib/scoring/presets';
import { auditTournamentFinalization } from '../lib/tournament/engine';

describe('BGMI Penalties & Disputes Domain - Unit Tests', () => {
  describe('Penalty Validation Schema (PenaltyCreateSchema)', () => {
    it('should successfully validate a legitimate penalty creation payload', () => {
      const validPayload = {
        teamId: 'team_godl',
        matchId: 'match_1',
        pointsDeducted: 3,
        reason: 'Late room entry by 3 minutes',
        evidenceUrl: 'https://cdn.esports.com/evidence/match1-late.png',
      };

      const parsed = PenaltyCreateSchema.safeParse(validPayload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.pointsDeducted).toBe(3);
        expect(parsed.data.reason).toBe('Late room entry by 3 minutes');
      }
    });

    it('should reject non-positive point deductions (<= 0)', () => {
      const zeroDeduction = {
        teamId: 'team_godl',
        pointsDeducted: 0,
        reason: 'Warning issued',
      };

      const negativeDeduction = {
        teamId: 'team_godl',
        pointsDeducted: -5,
        reason: 'Invalid deduction',
      };

      expect(PenaltyCreateSchema.safeParse(zeroDeduction).success).toBe(false);
      expect(PenaltyCreateSchema.safeParse(negativeDeduction).success).toBe(false);
    });

    it('should reject penalty with reason shorter than 3 characters', () => {
      const shortReason = {
        teamId: 'team_godl',
        pointsDeducted: 2,
        reason: 'No',
      };

      const result = PenaltyCreateSchema.safeParse(shortReason);
      expect(result.success).toBe(false);
    });
  });

  describe('Leaderboard Penalty Calculation & Void Handling', () => {
    const teams = [
      { id: 'team_a', name: 'Team Alpha', tag: 'ALPH' },
      { id: 'team_b', name: 'Team Bravo', tag: 'BRAV' },
    ];

    const matchScores = [
      {
        matchId: 'm1',
        matchNumber: 1,
        teamScores: [
          {
            teamId: 'team_a',
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
            teamId: 'team_b',
            placement: 2,
            kills: 8,
            placementPoints: 6,
            killPoints: 8,
            bonusPoints: 0,
            penaltyPoints: 0,
            totalPoints: 14,
            isWwcd: false,
          },
        ],
      },
    ];

    it('should deduct ACTIVE penalties and adjust standings rank', () => {
      // Team A had 20 pts, -8 active penalty = 12 pts net.
      // Team B has 14 pts net -> Team B becomes #1, Team A becomes #2.
      const penalties = [
        { teamId: 'team_a', pointsDeducted: 8, status: 'ACTIVE' },
      ];

      const leaderboard = calculateTournamentLeaderboard(teams, matchScores, penalties, BGIS_10_POINT_SYSTEM);
      expect(leaderboard[0].teamId).toBe('team_b');
      expect(leaderboard[0].totalPoints).toBe(14);
      expect(leaderboard[0].rank).toBe(1);

      expect(leaderboard[1].teamId).toBe('team_a');
      expect(leaderboard[1].totalPoints).toBe(12);
      expect(leaderboard[1].penaltyPoints).toBe(8);
      expect(leaderboard[1].rank).toBe(2);
    });

    it('should ignore VOIDED or inactive penalties during leaderboard calculation', () => {
      // Team A has a VOIDED penalty of 8 pts, so its net score remains 20 pts.
      const penalties = [
        { teamId: 'team_a', pointsDeducted: 8, status: 'VOIDED' },
      ];

      const leaderboard = calculateTournamentLeaderboard(teams, matchScores, penalties, BGIS_10_POINT_SYSTEM);
      expect(leaderboard[0].teamId).toBe('team_a');
      expect(leaderboard[0].totalPoints).toBe(20);
      expect(leaderboard[0].penaltyPoints).toBe(0);
    });

    it('should floor totalPoints at zero even if penalty exceeds earned points', () => {
      const heavyPenalty = [
        { teamId: 'team_a', pointsDeducted: 50, status: 'ACTIVE' },
      ];

      const leaderboard = calculateTournamentLeaderboard(teams, matchScores, heavyPenalty, BGIS_10_POINT_SYSTEM);
      const teamAStanding = leaderboard.find((s) => s.teamId === 'team_a');
      expect(teamAStanding?.totalPoints).toBe(0); // Floored at 0, not -30
    });
  });

  describe('Dispute Validation Schema (DisputeCreateSchema)', () => {
    it('should successfully validate dispute ticket creation', () => {
      const validDispute = {
        teamId: 'team_soul',
        matchId: 'match_2',
        category: 'SCORING' as const,
        description: 'Kill count recorded was 4 instead of 6 kills seen on broadcast stream.',
        evidenceUrl: 'https://youtube.com/watch?v=timestamp',
      };

      const parsed = DisputeCreateSchema.safeParse(validDispute);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.category).toBe('SCORING');
        expect(parsed.data.teamId).toBe('team_soul');
      }
    });

    it('should reject dispute with description shorter than 5 characters', () => {
      const invalid = {
        teamId: 'team_soul',
        description: 'Bug',
      };

      const result = DisputeCreateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('Dispute Impact on Tournament Finalization Pre-Flight Audit', () => {
    it('should fail finalization audit if any dispute remains open', () => {
      const audit = auditTournamentFinalization({
        totalMatches: 6,
        completedMatches: 6,
        verifiedResults: 6,
        openDisputesCount: 1, // 1 unresolved protest ticket!
        activeTeamsCount: 16,
      });

      expect(audit.canFinalize).toBe(false);
      const disputeCheck = audit.checklist.find((c) => c.id === 'disputes_resolved');
      expect(disputeCheck?.passed).toBe(false);
      expect(disputeCheck?.details).toContain('1 open disputes remaining');
    });

    it('should pass finalization audit once all disputes are resolved (openDisputesCount = 0)', () => {
      const audit = auditTournamentFinalization({
        totalMatches: 6,
        completedMatches: 6,
        verifiedResults: 6,
        openDisputesCount: 0,
        activeTeamsCount: 16,
      });

      expect(audit.canFinalize).toBe(true);
      const disputeCheck = audit.checklist.find((c) => c.id === 'disputes_resolved');
      expect(disputeCheck?.passed).toBe(true);
    });
  });
});
