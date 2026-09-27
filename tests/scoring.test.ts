import { describe, it, expect } from 'vitest';
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
import { RawTeamMatchInput } from '../lib/scoring/types';

describe('BGMI Scoring Engine - Unit Tests', () => {
  describe('Official BGIS 10-Point System Calculations', () => {
    it('should correctly score a 1st place WWCD with 12 kills', () => {
      const input: RawTeamMatchInput = {
        teamId: 'team_soul',
        placement: 1,
        kills: 12,
      };

      const result = calculateSingleTeamScore(input, BGIS_10_POINT_SYSTEM);
      expect(result.placementPoints).toBe(10);
      expect(result.killPoints).toBe(12);
      expect(result.totalPoints).toBe(22);
      expect(result.isWwcd).toBe(true);
    });

    it('should correctly score 2nd place with 4 kills', () => {
      const input: RawTeamMatchInput = {
        teamId: 'team_godl',
        placement: 2,
        kills: 4,
      };

      const result = calculateSingleTeamScore(input, BGIS_10_POINT_SYSTEM);
      expect(result.placementPoints).toBe(6);
      expect(result.killPoints).toBe(4);
      expect(result.totalPoints).toBe(10);
      expect(result.isWwcd).toBe(false);
    });

    it('should award 0 placement points for ranks 9 through 16', () => {
      const input: RawTeamMatchInput = {
        teamId: 'team_bottom',
        placement: 12,
        kills: 3,
      };

      const result = calculateSingleTeamScore(input, BGIS_10_POINT_SYSTEM);
      expect(result.placementPoints).toBe(0);
      expect(result.killPoints).toBe(3);
      expect(result.totalPoints).toBe(3);
    });

    it('should deduct penalty points from total match score', () => {
      const input: RawTeamMatchInput = {
        teamId: 'team_penalized',
        placement: 1,
        kills: 10,
        penaltyPoints: 5,
      };

      const result = calculateSingleTeamScore(input, BGIS_10_POINT_SYSTEM);
      // 10 placement + 10 kills - 5 penalty = 15
      expect(result.totalPoints).toBe(15);
    });

    it('should not allow total match points to be negative', () => {
      const input: RawTeamMatchInput = {
        teamId: 'team_negative',
        placement: 16,
        kills: 0,
        penaltyPoints: 10,
      };

      const result = calculateSingleTeamScore(input, BGIS_10_POINT_SYSTEM);
      expect(result.totalPoints).toBe(0);
    });
  });

  describe('BMPS 15-Point System Calculations', () => {
    it('should correctly score 1st place with 15 placement points', () => {
      const input: RawTeamMatchInput = {
        teamId: 'team_xspark',
        placement: 1,
        kills: 8,
      };

      const result = calculateSingleTeamScore(input, BMPS_15_POINT_SYSTEM);
      expect(result.placementPoints).toBe(15);
      expect(result.killPoints).toBe(8);
      expect(result.totalPoints).toBe(23);
    });

    it('should correctly score 8th place with 1 placement point in BMPS', () => {
      const input: RawTeamMatchInput = {
        teamId: 'team_8th',
        placement: 8,
        kills: 2,
      };

      const result = calculateSingleTeamScore(input, BMPS_15_POINT_SYSTEM);
      expect(result.placementPoints).toBe(1);
      expect(result.killPoints).toBe(2);
      expect(result.totalPoints).toBe(3);
    });
  });

  describe('Match Score Input Validation', () => {
    it('should fail if duplicate placements are submitted', () => {
      const inputs: RawTeamMatchInput[] = [
        { teamId: 'team_1', placement: 1, kills: 5 },
        { teamId: 'team_2', placement: 1, kills: 2 }, // Duplicate #1
      ];

      const validation = validateMatchScoreInputs(inputs, 2);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some((e) => e.includes('Duplicate placement rank #1'))).toBe(true);
    });

    it('should fail if duplicate teams are submitted', () => {
      const inputs: RawTeamMatchInput[] = [
        { teamId: 'team_1', placement: 1, kills: 5 },
        { teamId: 'team_1', placement: 2, kills: 2 }, // Duplicate team
      ];

      const validation = validateMatchScoreInputs(inputs, 2);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some((e) => e.includes('Duplicate team entry'))).toBe(true);
    });

    it('should fail if negative kills are entered', () => {
      const inputs: RawTeamMatchInput[] = [
        { teamId: 'team_1', placement: 1, kills: -3 },
      ];

      const validation = validateMatchScoreInputs(inputs, 1);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some((e) => e.includes('negative'))).toBe(true);
    });
  });

  describe('Leaderboard Aggregation & Multi-Tier Tie-Breakers', () => {
    const teams = [
      { id: 'team_a', name: 'Team Alpha', tag: 'ALPH' },
      { id: 'team_b', name: 'Team Bravo', tag: 'BRAV' },
    ];

    it('should resolve equal points using WWCD count', () => {
      // Both have 20 points, but Team A has 1 WWCD and Team B has 0 WWCDs
      const match1 = {
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

      const leaderboard = calculateTournamentLeaderboard(teams, [match1], [], BGIS_10_POINT_SYSTEM);
      expect(leaderboard[0].teamId).toBe('team_a');
      expect(leaderboard[0].rank).toBe(1);
      expect(leaderboard[1].teamId).toBe('team_b');
      expect(leaderboard[1].rank).toBe(2);
    });

    it('should resolve equal points and equal WWCDs using Total Placement Points', () => {
      // Team A: 1st place (10 pts) + 5 kills = 15 pts (1 WWCD, 10 PP, 5 KP)
      // Team B: 1st place (10 pts) + 5 kills = 15 pts
      // Let's make: Both have 22 points, 1 WWCD:
      // Team A: Match 1: 1st (10 PP) + 2 kills = 12. Match 2: 2nd (6 PP) + 4 kills = 10. Total: 22 pts, 16 PP, 6 KP.
      // Team B: Match 1: 1st (10 PP) + 4 kills = 14. Match 2: 3rd (5 PP) + 3 kills = 8. Total: 22 pts, 15 PP, 7 KP.
      const match1 = {
        matchId: 'm1',
        matchNumber: 1,
        teamScores: [
          {
            teamId: 'team_a',
            placement: 1,
            kills: 2,
            placementPoints: 10,
            killPoints: 2,
            bonusPoints: 0,
            penaltyPoints: 0,
            totalPoints: 12,
            isWwcd: true,
          },
          {
            teamId: 'team_b',
            placement: 1,
            kills: 4,
            placementPoints: 10,
            killPoints: 4,
            bonusPoints: 0,
            penaltyPoints: 0,
            totalPoints: 14,
            isWwcd: true,
          },
        ],
      };

      const match2 = {
        matchId: 'm2',
        matchNumber: 2,
        teamScores: [
          {
            teamId: 'team_a',
            placement: 2,
            kills: 4,
            placementPoints: 6,
            killPoints: 4,
            bonusPoints: 0,
            penaltyPoints: 0,
            totalPoints: 10,
            isWwcd: false,
          },
          {
            teamId: 'team_b',
            placement: 3,
            kills: 3,
            placementPoints: 5,
            killPoints: 3,
            bonusPoints: 0,
            penaltyPoints: 0,
            totalPoints: 8,
            isWwcd: false,
          },
        ],
      };

      const leaderboard = calculateTournamentLeaderboard(
        teams,
        [match1, match2],
        [],
        BGIS_10_POINT_SYSTEM
      );
      // Both have 22 points, 1 WWCD.
      // Team A has 16 PP. Team B has 15 PP.
      expect(leaderboard[0].teamId).toBe('team_a');
      expect(leaderboard[0].totalPoints).toBe(22);
      expect(leaderboard[0].placementPoints).toBe(16);
      expect(leaderboard[1].teamId).toBe('team_b');
      expect(leaderboard[1].totalPoints).toBe(22);
      expect(leaderboard[1].placementPoints).toBe(15);
    });

    it('should correctly apply general tournament penalties to leaderboard', () => {
      const match1 = {
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

      const penalties = [
        { teamId: 'team_a', pointsDeducted: 10, status: 'ACTIVE' },
      ];

      const leaderboard = calculateTournamentLeaderboard(
        teams,
        [match1],
        penalties,
        BGIS_10_POINT_SYSTEM
      );
      // Team A had 20 points, minus 10 penalty = 10 net total points
      // Team B has 11 net total points
      expect(leaderboard[0].teamId).toBe('team_b');
      expect(leaderboard[0].totalPoints).toBe(11);
      expect(leaderboard[1].teamId).toBe('team_a');
      expect(leaderboard[1].totalPoints).toBe(10);
    });
  });
});
