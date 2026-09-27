import { describe, it, expect } from 'vitest';
import {
  calculateSingleTeamScore,
  calculateMatchScores,
  calculateTournamentLeaderboard,
  calculateStandings,
  validateMatchScores,
  validateMatchScoreInputs,
} from '../lib/scoring/engine';
import {
  BGIS_10_POINT_SYSTEM,
  BMPS_15_POINT_SYSTEM,
  PMCO_20_POINT_SYSTEM,
  SCORING_PRESETS,
  getScoringPreset,
  createCustomScoringRule,
} from '../lib/scoring/presets';
import {
  RawTeamMatchInput,
  CalculatedTeamMatchScore,
  ScoringRuleConfig,
} from '../lib/scoring/types';

describe('BGMI Scoring Engine - Comprehensive Test Suite', () => {
  // =========================================================================
  // 1. Official BGIS 10-Point System
  // =========================================================================
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

    it('should correctly score 3rd through 8th placements in BGIS', () => {
      const expectations: Record<number, number> = {
        3: 5,
        4: 4,
        5: 3,
        6: 2,
        7: 1,
        8: 1,
      };

      for (const [rankStr, expectedPP] of Object.entries(expectations)) {
        const rank = parseInt(rankStr, 10);
        const res = calculateSingleTeamScore(
          { teamId: `team_${rank}`, placement: rank, kills: 0 },
          BGIS_10_POINT_SYSTEM
        );
        expect(res.placementPoints).toBe(expectedPP);
        expect(res.totalPoints).toBe(expectedPP);
      }
    });

    it('should award 0 placement points for ranks 9 through 16', () => {
      for (let rank = 9; rank <= 16; rank++) {
        const input: RawTeamMatchInput = {
          teamId: `team_${rank}`,
          placement: rank,
          kills: 3,
        };
        const result = calculateSingleTeamScore(input, BGIS_10_POINT_SYSTEM);
        expect(result.placementPoints).toBe(0);
        expect(result.killPoints).toBe(3);
        expect(result.totalPoints).toBe(3);
      }
    });

    it('should deduct match-level penalty points from total score', () => {
      const input: RawTeamMatchInput = {
        teamId: 'team_penalized',
        placement: 1,
        kills: 10,
        penaltyPoints: 5,
      };

      const result = calculateSingleTeamScore(input, BGIS_10_POINT_SYSTEM);
      // 10 PP + 10 KP - 5 Penalty = 15
      expect(result.totalPoints).toBe(15);
    });

    it('should award bonus points in match score calculation', () => {
      const input: RawTeamMatchInput = {
        teamId: 'team_bonus',
        placement: 1,
        kills: 5,
        bonusPoints: 3,
      };

      const result = calculateSingleTeamScore(input, BGIS_10_POINT_SYSTEM);
      // 10 PP + 5 KP + 3 Bonus = 18
      expect(result.bonusPoints).toBe(3);
      expect(result.totalPoints).toBe(18);
    });

    it('should award configured wwcdBonus to 1st place only', () => {
      const ruleWithWwcdBonus: ScoringRuleConfig = {
        ...BGIS_10_POINT_SYSTEM,
        wwcdBonus: 2.0,
      };

      const firstPlace = calculateSingleTeamScore(
        { teamId: 't1', placement: 1, kills: 0 },
        ruleWithWwcdBonus
      );
      // 10 PP + 0 KP + 2 WWCD bonus = 12
      expect(firstPlace.bonusPoints).toBe(2);
      expect(firstPlace.totalPoints).toBe(12);

      const secondPlace = calculateSingleTeamScore(
        { teamId: 't2', placement: 2, kills: 0 },
        ruleWithWwcdBonus
      );
      expect(secondPlace.bonusPoints).toBe(0);
      expect(secondPlace.totalPoints).toBe(6);
    });

    it('should not allow total match points to be negative by default', () => {
      const input: RawTeamMatchInput = {
        teamId: 'team_negative',
        placement: 16,
        kills: 0,
        penaltyPoints: 10,
      };

      const result = calculateSingleTeamScore(input, BGIS_10_POINT_SYSTEM);
      expect(result.totalPoints).toBe(0);
    });

    it('should allow negative total points if rule explicitly enables allowNegativeScores', () => {
      const permissiveRule: ScoringRuleConfig = {
        ...BGIS_10_POINT_SYSTEM,
        allowNegativeScores: true,
      };

      const input: RawTeamMatchInput = {
        teamId: 'team_negative',
        placement: 16,
        kills: 0,
        penaltyPoints: 10,
      };

      const result = calculateSingleTeamScore(input, permissiveRule);
      expect(result.totalPoints).toBe(-10);
    });
  });

  // =========================================================================
  // 2. BMPS 15-Point System
  // =========================================================================
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
      expect(result.isWwcd).toBe(true);
    });

    it('should correctly score ranks 2 through 7 in BMPS', () => {
      const expectations: Record<number, number> = {
        2: 12,
        3: 10,
        4: 8,
        5: 6,
        6: 4,
        7: 2,
      };

      for (const [rankStr, expectedPP] of Object.entries(expectations)) {
        const rank = parseInt(rankStr, 10);
        const res = calculateSingleTeamScore(
          { teamId: `t_${rank}`, placement: rank, kills: 0 },
          BMPS_15_POINT_SYSTEM
        );
        expect(res.placementPoints).toBe(expectedPP);
      }
    });

    it('should award 1 placement point for ranks 8 through 12 in BMPS', () => {
      for (let rank = 8; rank <= 12; rank++) {
        const result = calculateSingleTeamScore(
          { teamId: `t_${rank}`, placement: rank, kills: 2 },
          BMPS_15_POINT_SYSTEM
        );
        expect(result.placementPoints).toBe(1);
        expect(result.killPoints).toBe(2);
        expect(result.totalPoints).toBe(3);
      }
    });

    it('should award 0 placement points for ranks 13 through 16 in BMPS', () => {
      for (let rank = 13; rank <= 16; rank++) {
        const result = calculateSingleTeamScore(
          { teamId: `t_${rank}`, placement: rank, kills: 1 },
          BMPS_15_POINT_SYSTEM
        );
        expect(result.placementPoints).toBe(0);
        expect(result.killPoints).toBe(1);
        expect(result.totalPoints).toBe(1);
      }
    });
  });

  // =========================================================================
  // 3. Classic PMCO 20-Point System
  // =========================================================================
  describe('Classic PMCO 20-Point System Calculations', () => {
    it('should correctly score 1st place with 20 placement points', () => {
      const input: RawTeamMatchInput = {
        teamId: 'team_pmco',
        placement: 1,
        kills: 10,
      };

      const result = calculateSingleTeamScore(input, PMCO_20_POINT_SYSTEM);
      expect(result.placementPoints).toBe(20);
      expect(result.killPoints).toBe(10);
      expect(result.totalPoints).toBe(30);
    });

    it('should award correct tiered points for PMCO top 10', () => {
      const expectedPMCO: Record<number, number> = {
        1: 20,
        2: 14,
        3: 10,
        4: 8,
        5: 7,
        6: 6,
        7: 5,
        8: 4,
        9: 3,
        10: 2,
      };

      for (const [rankStr, expectedPP] of Object.entries(expectedPMCO)) {
        const rank = parseInt(rankStr, 10);
        const res = calculateSingleTeamScore(
          { teamId: `pmco_${rank}`, placement: rank, kills: 0 },
          PMCO_20_POINT_SYSTEM
        );
        expect(res.placementPoints).toBe(expectedPP);
      }
    });

    it('should award 1 placement point for ranks 11 through 16 in PMCO', () => {
      for (let rank = 11; rank <= 16; rank++) {
        const res = calculateSingleTeamScore(
          { teamId: `pmco_${rank}`, placement: rank, kills: 0 },
          PMCO_20_POINT_SYSTEM
        );
        expect(res.placementPoints).toBe(1);
      }
    });
  });

  // =========================================================================
  // 4. Presets Library & Factory
  // =========================================================================
  describe('Presets Library & Helper Functions', () => {
    it('should provide presets map with BGIS_10, BMPS_15, and PMCO_20', () => {
      expect(SCORING_PRESETS.BGIS_10).toBeDefined();
      expect(SCORING_PRESETS.BMPS_15).toBeDefined();
      expect(SCORING_PRESETS.PMCO_20).toBeDefined();
    });

    it('should retrieve presets with getScoringPreset and fallback to BGIS 10', () => {
      expect(getScoringPreset('BMPS_15')).toBe(BMPS_15_POINT_SYSTEM);
      expect(getScoringPreset('PMCO_20')).toBe(PMCO_20_POINT_SYSTEM);
      expect(getScoringPreset('NON_EXISTENT')).toBe(BGIS_10_POINT_SYSTEM);
    });

    it('should allow creating custom scoring rules with createCustomScoringRule', () => {
      const custom = createCustomScoringRule({
        name: 'High Kill Blitz',
        killPointsPerElim: 2.0,
        placementPoints: { 1: 15, 2: 10, 3: 5 },
      });

      expect(custom.name).toBe('High Kill Blitz');
      expect(custom.killPointsPerElim).toBe(2.0);
      expect(custom.placementPoints[1]).toBe(15);
      expect(custom.placementPoints[2]).toBe(10);
    });
  });

  // =========================================================================
  // 5. Match Score Input Validation
  // =========================================================================
  describe('Match Score Input Validation', () => {
    it('should fail if no team score entries are provided', () => {
      const validation = validateMatchScores([]);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some((e) => e.includes('No team score entries'))).toBe(true);
    });

    it('should fail if a row has an empty team selection', () => {
      const inputs: RawTeamMatchInput[] = [
        { teamId: '', placement: 1, kills: 5 },
      ];
      const validation = validateMatchScores(inputs, 1);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some((e) => e.includes('empty team selection'))).toBe(true);
    });

    it('should fail if duplicate placements are submitted', () => {
      const inputs: RawTeamMatchInput[] = [
        { teamId: 'team_1', placement: 1, kills: 5 },
        { teamId: 'team_2', placement: 1, kills: 2 }, // Duplicate #1
      ];

      const validation = validateMatchScores(inputs, 2);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some((e) => e.includes('Duplicate placement rank #1'))).toBe(true);
    });

    it('should fail if duplicate teams are submitted in the same match', () => {
      const inputs: RawTeamMatchInput[] = [
        { teamId: 'team_1', placement: 1, kills: 5 },
        { teamId: 'team_1', placement: 2, kills: 2 }, // Duplicate team
      ];

      const validation = validateMatchScores(inputs, 2);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some((e) => e.includes('Duplicate team entry'))).toBe(true);
    });

    it('should fail if negative kills are entered', () => {
      const inputs: RawTeamMatchInput[] = [
        { teamId: 'team_1', placement: 1, kills: -3 },
      ];

      const validation = validateMatchScores(inputs, 1);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some((e) => e.includes('negative'))).toBe(true);
    });

    it('should fail if placement is outside 1-25 range', () => {
      const inputZero: RawTeamMatchInput[] = [
        { teamId: 't1', placement: 0, kills: 2 },
      ];
      const valZero = validateMatchScores(inputZero, 1);
      expect(valZero.isValid).toBe(false);

      const inputTooHigh: RawTeamMatchInput[] = [
        { teamId: 't1', placement: 26, kills: 2 },
      ];
      const valHigh = validateMatchScores(inputTooHigh, 1);
      expect(valHigh.isValid).toBe(false);
      expect(valHigh.errors.some((e) => e.includes('between 1 and 25'))).toBe(true);
    });

    it('should fail if lobby participation exceeds 25 squads', () => {
      const inputs: RawTeamMatchInput[] = Array.from({ length: 26 }, (_, i) => ({
        teamId: `team_${i + 1}`,
        placement: i + 1,
        kills: 1,
      }));

      const validation = validateMatchScores(inputs);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some((e) => e.includes('Participation limit exceeded'))).toBe(true);
    });

    it('should issue a warning for unusually high kill counts (> 60)', () => {
      const inputs: RawTeamMatchInput[] = [
        { teamId: 'team_terminator', placement: 1, kills: 65 },
      ];

      const validation = validateMatchScores(inputs, 1);
      expect(validation.isValid).toBe(true);
      expect(validation.warnings.some((w) => w.includes('unusually high kill count'))).toBe(true);
    });

    it('should work seamlessly via the validateMatchScoreInputs alias', () => {
      const inputs: RawTeamMatchInput[] = [
        { teamId: 't1', placement: 1, kills: 4 },
      ];
      const validation = validateMatchScoreInputs(inputs, 1);
      expect(validation.isValid).toBe(true);
    });
  });

  // =========================================================================
  // 6. Multi-Tier Configurable Tie-Breakers
  // =========================================================================
  describe('Multi-Tier Tie-Breaker Resolution Engine', () => {
    const teams = [
      { id: 'team_a', name: 'Team Alpha', tag: 'ALPH' },
      { id: 'team_b', name: 'Team Bravo', tag: 'BRAV' },
    ];

    it('Tier 1: resolves equal points using WWCD count', () => {
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
      expect(leaderboard[0].tieBreakReason).toContain('Higher WWCD');
      expect(leaderboard[1].teamId).toBe('team_b');
      expect(leaderboard[1].rank).toBe(2);
    });

    it('Tier 2: resolves equal points and equal WWCDs using Placement Points', () => {
      // Both have 22 points and 1 WWCD:
      // Team A: 16 Placement Points, 6 Kill Points
      // Team B: 15 Placement Points, 7 Kill Points
      const match1 = {
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
      expect(leaderboard[0].teamId).toBe('team_a');
      expect(leaderboard[0].placementPoints).toBe(16);
      expect(leaderboard[0].tieBreakReason).toContain('Higher Placement Points');
      expect(leaderboard[1].teamId).toBe('team_b');
      expect(leaderboard[1].placementPoints).toBe(15);
    });

    it('Tier 3: resolves equal points, WWCDs, and Placement Points using Kill Points', () => {
      // Custom rule with WWCD -> PLACEMENT_POINTS -> KILL_POINTS
      // Both teams have 20 points, 0 WWCD, 10 PP, but Team A has 10 kills and Team B has 8 kills
      // (e.g. Team B had 2 bonus points)
      const match1 = {
        matchNumber: 1,
        teamScores: [
          {
            teamId: 'team_a',
            placement: 2,
            kills: 10,
            placementPoints: 6,
            killPoints: 10,
            bonusPoints: 0,
            penaltyPoints: 0,
            totalPoints: 16,
            isWwcd: false,
          },
          {
            teamId: 'team_b',
            placement: 2,
            kills: 8,
            placementPoints: 6,
            killPoints: 8,
            bonusPoints: 2, // 6 PP + 8 KP + 2 Bonus = 16
            penaltyPoints: 0,
            totalPoints: 16,
            isWwcd: false,
          },
        ],
      };

      const leaderboard = calculateTournamentLeaderboard(teams, [match1], [], BGIS_10_POINT_SYSTEM);
      expect(leaderboard[0].teamId).toBe('team_a');
      expect(leaderboard[0].killPoints).toBe(10);
      expect(leaderboard[0].tieBreakReason).toContain('Higher Kill Points');
      expect(leaderboard[1].teamId).toBe('team_b');
      expect(leaderboard[1].killPoints).toBe(8);
    });

    it('Tier 4: resolves equal points, WWCD, PP, and KP using Best Match Score', () => {
      // Both teams: 2 matches, 0 WWCD, Total 20 pts, 10 PP, 10 KP.
      // Team A: Match 1: 15 pts (5 PP + 10 KP). Match 2: 5 pts (5 PP + 0 KP). Best match = 15.
      // Team B: Match 1: 10 pts (5 PP + 5 KP). Match 2: 10 pts (5 PP + 5 KP). Best match = 10.
      const match1 = {
        matchNumber: 1,
        teamScores: [
          {
            teamId: 'team_a',
            placement: 3,
            kills: 10,
            placementPoints: 5,
            killPoints: 10,
            bonusPoints: 0,
            penaltyPoints: 0,
            totalPoints: 15,
            isWwcd: false,
          },
          {
            teamId: 'team_b',
            placement: 3,
            kills: 5,
            placementPoints: 5,
            killPoints: 5,
            bonusPoints: 0,
            penaltyPoints: 0,
            totalPoints: 10,
            isWwcd: false,
          },
        ],
      };

      const match2 = {
        matchNumber: 2,
        teamScores: [
          {
            teamId: 'team_a',
            placement: 3,
            kills: 0,
            placementPoints: 5,
            killPoints: 0,
            bonusPoints: 0,
            penaltyPoints: 0,
            totalPoints: 5,
            isWwcd: false,
          },
          {
            teamId: 'team_b',
            placement: 3,
            kills: 5,
            placementPoints: 5,
            killPoints: 5,
            bonusPoints: 0,
            penaltyPoints: 0,
            totalPoints: 10,
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

      // Both have 20 totalPoints, 0 WWCD, 10 PP, 10 KP.
      // Team A best match = 15. Team B best match = 10.
      expect(leaderboard[0].teamId).toBe('team_a');
      expect(leaderboard[0].bestMatchScore).toBe(15);
      expect(leaderboard[0].tieBreakReason).toContain('Higher Best Match Score');
      expect(leaderboard[1].teamId).toBe('team_b');
      expect(leaderboard[1].bestMatchScore).toBe(10);
    });

    it('Tier 5: resolves ties using Last Match Placement when all prior tiers are equal', () => {
      // Both teams: Match 1: 10 pts (5 PP + 5 KP, placement 3).
      // Match 2: Team A placed 2nd with 4 kills (6 PP + 4 KP = 10 pts).
      // Match 2: Team B placed 3rd with 5 kills (5 PP + 5 KP = 10 pts).
      // Wait, that changes PP. To keep PP equal:
      // Let's use 2 matches:
      // Team A: Match 1 placed 4th (4 PP, 6 KP = 10). Match 2 placed 2nd (6 PP, 4 KP = 10). Total = 20, PP = 10, KP = 10, best = 10. Last match placement = #2.
      // Team B: Match 1 placed 2nd (6 PP, 4 KP = 10). Match 2 placed 4th (4 PP, 6 KP = 10). Total = 20, PP = 10, KP = 10, best = 10. Last match placement = #4.
      const match1 = {
        matchNumber: 1,
        teamScores: [
          {
            teamId: 'team_a',
            placement: 4,
            kills: 6,
            placementPoints: 4,
            killPoints: 6,
            bonusPoints: 0,
            penaltyPoints: 0,
            totalPoints: 10,
            isWwcd: false,
          },
          {
            teamId: 'team_b',
            placement: 2,
            kills: 4,
            placementPoints: 6,
            killPoints: 4,
            bonusPoints: 0,
            penaltyPoints: 0,
            totalPoints: 10,
            isWwcd: false,
          },
        ],
      };

      const match2 = {
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
            placement: 4,
            kills: 6,
            placementPoints: 4,
            killPoints: 6,
            bonusPoints: 0,
            penaltyPoints: 0,
            totalPoints: 10,
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

      // Both: 20 pts, 0 WWCD, 10 PP, 10 KP, best match = 10.
      // Team A placed 2nd in Match 2. Team B placed 4th in Match 2.
      expect(leaderboard[0].teamId).toBe('team_a');
      expect(leaderboard[0].lastMatchPlacement).toBe(2);
      expect(leaderboard[0].tieBreakReason).toContain('Better Last Match Placement');
      expect(leaderboard[1].teamId).toBe('team_b');
      expect(leaderboard[1].lastMatchPlacement).toBe(4);
    });

    it('falls back to alphabetical order when tied across all 5 criteria', () => {
      // Both teams with identical performance in single match
      const match1 = {
        matchNumber: 1,
        teamScores: [
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
          {
            teamId: 'team_a',
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

      const leaderboard = calculateTournamentLeaderboard(teams, [match1], [], BGIS_10_POINT_SYSTEM);
      // 'Team Alpha' comes before 'Team Bravo' alphabetically
      expect(leaderboard[0].teamId).toBe('team_a');
      expect(leaderboard[0].tieBreakReason).toContain('alphabetical');
      expect(leaderboard[1].teamId).toBe('team_b');
    });

    it('should respect custom tie-breaker priorities', () => {
      // Rule prioritizing KILL_POINTS over WWCD
      const customRule: ScoringRuleConfig = {
        ...BGIS_10_POINT_SYSTEM,
        tieBreakers: ['KILL_POINTS', 'WWCD'],
      };

      // Team A has 1 WWCD and 2 kills = 12 pts
      // Team B has 0 WWCD and 6 kills = 12 pts (6 PP + 6 KP)
      const match = {
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
            placement: 2,
            kills: 6,
            placementPoints: 6,
            killPoints: 6,
            bonusPoints: 0,
            penaltyPoints: 0,
            totalPoints: 12,
            isWwcd: false,
          },
        ],
      };

      const leaderboard = calculateTournamentLeaderboard(teams, [match], [], customRule);
      // Team B ranks 1st because KILL_POINTS was prioritized first (6 vs 2)
      expect(leaderboard[0].teamId).toBe('team_b');
      expect(leaderboard[0].tieBreakReason).toContain('Higher Kill Points');
      expect(leaderboard[1].teamId).toBe('team_a');
    });
  });

  // =========================================================================
  // 7. General Penalties, Bonuses, 0 Kills, 0 Placement Points & Disqualifications
  // =========================================================================
  describe('Penalties, Bonuses, 0 Points & Disqualification Handling', () => {
    const teams = [
      { id: 'team_a', name: 'Team Alpha', tag: 'ALPH' },
      { id: 'team_b', name: 'Team Bravo', tag: 'BRAV' },
      { id: 'team_dq', name: 'Team Cheat', tag: 'CHET', status: 'DISQUALIFIED' },
    ];

    it('should deduct active general tournament penalties from leaderboard score', () => {
      const match = {
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
        { teamId: 'team_b', pointsDeducted: 5, status: 'VOIDED' }, // Should NOT deduct
      ];

      const leaderboard = calculateTournamentLeaderboard(
        [teams[0], teams[1]],
        [match],
        penalties,
        BGIS_10_POINT_SYSTEM
      );

      // Team A: 20 - 10 = 10 net total
      // Team B: 11 - 0 = 11 net total (voided penalty ignored)
      expect(leaderboard[0].teamId).toBe('team_b');
      expect(leaderboard[0].totalPoints).toBe(11);
      expect(leaderboard[1].teamId).toBe('team_a');
      expect(leaderboard[1].totalPoints).toBe(10);
    });

    it('should correctly handle zero kills and zero placement points without errors', () => {
      const input: RawTeamMatchInput = {
        teamId: 'team_zero',
        placement: 16,
        kills: 0,
      };

      const res = calculateSingleTeamScore(input, BGIS_10_POINT_SYSTEM);
      expect(res.placementPoints).toBe(0);
      expect(res.killPoints).toBe(0);
      expect(res.totalPoints).toBe(0);
      expect(res.isWwcd).toBe(false);
    });

    it('should handle match-level disqualification by zeroing points', () => {
      const dqInput: RawTeamMatchInput = {
        teamId: 'team_dq_match',
        placement: 1,
        kills: 15,
        isDisqualified: true,
      };

      const res = calculateSingleTeamScore(dqInput, BGIS_10_POINT_SYSTEM);
      expect(res.placementPoints).toBe(0);
      expect(res.killPoints).toBe(0);
      expect(res.totalPoints).toBe(0);
      expect(res.isWwcd).toBe(false);
      expect(res.isDisqualified).toBe(true);
    });

    it('should relegate disqualified teams to the bottom of the tournament leaderboard', () => {
      const match = {
        matchNumber: 1,
        teamScores: [
          {
            teamId: 'team_dq',
            placement: 1,
            kills: 20,
            placementPoints: 10,
            killPoints: 20,
            bonusPoints: 0,
            penaltyPoints: 0,
            totalPoints: 30, // Had 30 points before being disqualified!
            isWwcd: true,
          },
          {
            teamId: 'team_a',
            placement: 2,
            kills: 5,
            placementPoints: 6,
            killPoints: 5,
            bonusPoints: 0,
            penaltyPoints: 0,
            totalPoints: 11,
            isWwcd: false,
          },
          {
            teamId: 'team_b',
            placement: 3,
            kills: 2,
            placementPoints: 5,
            killPoints: 2,
            bonusPoints: 0,
            penaltyPoints: 0,
            totalPoints: 7,
            isWwcd: false,
          },
        ],
      };

      const leaderboard = calculateTournamentLeaderboard(teams, [match], [], BGIS_10_POINT_SYSTEM);

      // Active teams must occupy ranks 1 and 2
      expect(leaderboard[0].teamId).toBe('team_a');
      expect(leaderboard[0].rank).toBe(1);
      expect(leaderboard[1].teamId).toBe('team_b');
      expect(leaderboard[1].rank).toBe(2);

      // Disqualified team relegated to last rank (#3) despite having 30 points
      const dqStanding = leaderboard.find((s) => s.teamId === 'team_dq')!;
      expect(dqStanding.rank).toBe(3);
      expect(dqStanding.isDisqualified).toBe(true);
      expect(dqStanding.tieBreakReason).toBe('Disqualified from tournament');
    });

    it('should sort multiple disqualified teams amongst themselves at the bottom', () => {
      const multiTeams = [
        { id: 't_active', name: 'Active Team', tag: 'ACT' },
        { id: 't_dq1', name: 'DQ One', tag: 'DQ1', status: 'DISQUALIFIED' },
        { id: 't_dq2', name: 'DQ Two', tag: 'DQ2', status: 'DISQUALIFIED' },
      ];

      const match = {
        matchNumber: 1,
        teamScores: [
          {
            teamId: 't_active',
            placement: 3,
            kills: 2,
            placementPoints: 5,
            killPoints: 2,
            bonusPoints: 0,
            penaltyPoints: 0,
            totalPoints: 7,
            isWwcd: false,
          },
          {
            teamId: 't_dq1',
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
            teamId: 't_dq2',
            placement: 2,
            kills: 4,
            placementPoints: 6,
            killPoints: 4,
            bonusPoints: 0,
            penaltyPoints: 0,
            totalPoints: 10,
            isWwcd: false,
          },
        ],
      };

      const leaderboard = calculateTournamentLeaderboard(multiTeams, [match], [], BGIS_10_POINT_SYSTEM);

      expect(leaderboard[0].teamId).toBe('t_active');
      expect(leaderboard[0].rank).toBe(1);

      // Both DQ teams are ranked after active teams, sorted by points
      expect(leaderboard[1].teamId).toBe('t_dq1');
      expect(leaderboard[1].rank).toBe(2);
      expect(leaderboard[2].teamId).toBe('t_dq2');
      expect(leaderboard[2].rank).toBe(3);
    });
  });

  // =========================================================================
  // 8. Determinism, Functional Purity & Contract Overloads
  // =========================================================================
  describe('Functional Purity, Determinism & Overloaded Contract Signatures', () => {
    it('is strictly deterministic: identical inputs yield identical rankings across repeated calls', () => {
      const teams = [
        { id: 't1', name: 'Team One', tag: 'T1' },
        { id: 't2', name: 'Team Two', tag: 'T2' },
      ];
      const match = {
        matchNumber: 1,
        teamScores: [
          {
            teamId: 't1',
            placement: 1,
            kills: 5,
            placementPoints: 10,
            killPoints: 5,
            bonusPoints: 0,
            penaltyPoints: 0,
            totalPoints: 15,
            isWwcd: true,
          },
          {
            teamId: 't2',
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

      const run1 = calculateTournamentLeaderboard(teams, [match], [], BGIS_10_POINT_SYSTEM);
      const run2 = calculateTournamentLeaderboard(teams, [match], [], BGIS_10_POINT_SYSTEM);

      expect(run1).toEqual(run2);
    });

    it('supports calculateMatchScores with both argument orders (inputs, rule) and (rule, inputs)', () => {
      const inputs: RawTeamMatchInput[] = [
        { teamId: 't2', placement: 2, kills: 3 },
        { teamId: 't1', placement: 1, kills: 7 },
      ];

      const res1 = calculateMatchScores(inputs, BGIS_10_POINT_SYSTEM);
      const res2 = calculateMatchScores(BGIS_10_POINT_SYSTEM, inputs);

      expect(res1).toEqual(res2);
      expect(res1[0].teamId).toBe('t1'); // Sorted by placement ascending
      expect(res1[1].teamId).toBe('t2');
    });

    it('supports calculateSingleTeamScore with both argument orders', () => {
      const input: RawTeamMatchInput = { teamId: 't1', placement: 1, kills: 5 };
      const res1 = calculateSingleTeamScore(input, BGIS_10_POINT_SYSTEM);
      const res2 = calculateSingleTeamScore(BGIS_10_POINT_SYSTEM, input);

      expect(res1).toEqual(res2);
    });

    it('supports calculateStandings with (rule, matchScores, penalties, teams)', () => {
      const matchScores: CalculatedTeamMatchScore[][] = [
        [
          {
            teamId: 't1',
            placement: 1,
            kills: 5,
            placementPoints: 10,
            killPoints: 5,
            bonusPoints: 0,
            penaltyPoints: 0,
            totalPoints: 15,
            isWwcd: true,
          },
        ],
      ];

      const standings = calculateStandings(
        BGIS_10_POINT_SYSTEM,
        matchScores,
        [],
        [{ id: 't1', name: 'Team One', tag: 'T1' }]
      );

      expect(standings.length).toBe(1);
      expect(standings[0].teamId).toBe('t1');
      expect(standings[0].totalPoints).toBe(15);
    });

    it('automatically registers teams from match scores if teams array is not provided', () => {
      const match = {
        matchNumber: 1,
        teamScores: [
          {
            teamId: 't_auto',
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

      const standings = calculateTournamentLeaderboard([], [match], [], BGIS_10_POINT_SYSTEM);
      expect(standings.length).toBe(1);
      expect(standings[0].teamId).toBe('t_auto');
      expect(standings[0].totalPoints).toBe(14);
    });
  });
});
