import { describe, it, expect } from 'vitest';
import { validateMatchScoreInputs, calculateMatchScores } from '../lib/scoring/engine';
import { BGIS_10_POINT_SYSTEM } from '../lib/scoring/presets';
import { MatchResultSubmissionSchema } from '../lib/validation/schemas';
import { RawTeamMatchInput } from '../lib/scoring/types';

describe('BGMI Results & Score Entry Lifecycle Domain - Unit Tests', () => {
  describe('Match Result Submission Schema (MatchResultSubmissionSchema)', () => {
    it('should validate complete 16-row score sheet payload', () => {
      const payload = {
        resultStatus: 'SUBMITTED' as const,
        scores: Array.from({ length: 16 }, (_, i) => ({
          teamId: `team_${i + 1}`,
          placement: i + 1,
          kills: 16 - i,
          bonusPoints: 0,
          penaltyPoints: 0,
          notes: i === 0 ? 'WWCD winner' : undefined,
        })),
      };

      const result = MatchResultSubmissionSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scores.length).toBe(16);
        expect(result.data.resultStatus).toBe('SUBMITTED');
      }
    });

    it('should reject score submission with empty scores array', () => {
      const emptyPayload = {
        resultStatus: 'SUBMITTED',
        scores: [],
      };

      const result = MatchResultSubmissionSchema.safeParse(emptyPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('At least 1 team score must be submitted'))).toBe(true);
      }
    });

    it('should reject score row with negative kills or invalid placement (> 32)', () => {
      const invalidRow = {
        resultStatus: 'SUBMITTED',
        scores: [
          {
            teamId: 't1',
            placement: 33, // Exceeds max 32
            kills: -1,     // Negative
          },
        ],
      };

      const result = MatchResultSubmissionSchema.safeParse(invalidRow);
      expect(result.success).toBe(false);
    });
  });

  describe('Score Entry Validation Guard (validateMatchScoreInputs)', () => {
    it('should fail validation on duplicate placement rank', () => {
      const inputs: RawTeamMatchInput[] = [
        { teamId: 't1', placement: 1, kills: 8 },
        { teamId: 't2', placement: 1, kills: 4 }, // Duplicate 1st place!
      ];

      const check = validateMatchScoreInputs(inputs, 2);
      expect(check.isValid).toBe(false);
      expect(check.errors.some((e) => e.includes('Duplicate placement rank #1'))).toBe(true);
    });

    it('should fail validation on duplicate team entry', () => {
      const inputs: RawTeamMatchInput[] = [
        { teamId: 'team_soul', placement: 1, kills: 10 },
        { teamId: 'team_soul', placement: 2, kills: 2 }, // Duplicate team
      ];

      const check = validateMatchScoreInputs(inputs, 2);
      expect(check.isValid).toBe(false);
      expect(check.errors.some((e) => e.includes('Duplicate team entry'))).toBe(true);
    });

    it('should fail validation if placement rank is less than 1', () => {
      const inputs: RawTeamMatchInput[] = [
        { teamId: 't1', placement: 0, kills: 5 },
      ];

      const check = validateMatchScoreInputs(inputs, 1);
      expect(check.isValid).toBe(false);
      expect(check.errors.some((e) => e.includes('Must be 1 or greater'))).toBe(true);
    });

    it('should emit a warning when received teams count is fewer than expected standard lobby size', () => {
      const inputs: RawTeamMatchInput[] = [
        { teamId: 't1', placement: 1, kills: 10 },
        { teamId: 't2', placement: 2, kills: 5 },
      ];

      const check = validateMatchScoreInputs(inputs, 16);
      expect(check.isValid).toBe(true); // Still valid format
      expect(check.warnings.some((w) => w.includes('fewer than expected standard lobby size'))).toBe(true);
    });

    it('should emit a warning on unusually high kill counts (> 60)', () => {
      const inputs: RawTeamMatchInput[] = [
        { teamId: 't1', placement: 1, kills: 65 },
      ];

      const check = validateMatchScoreInputs(inputs, 1);
      expect(check.isValid).toBe(true);
      expect(check.warnings.some((w) => w.includes('unusually high kill count'))).toBe(true);
    });
  });

  describe('Match Score Calculation Ordering', () => {
    it('should calculate and return scores sorted in ascending order of placement rank', () => {
      const rawInputs: RawTeamMatchInput[] = [
        { teamId: 't3', placement: 3, kills: 2 },
        { teamId: 't1', placement: 1, kills: 10 },
        { teamId: 't2', placement: 2, kills: 6 },
      ];

      const calculated = calculateMatchScores(rawInputs, BGIS_10_POINT_SYSTEM);
      expect(calculated.length).toBe(3);
      expect(calculated[0].teamId).toBe('t1');
      expect(calculated[0].placement).toBe(1);
      expect(calculated[1].teamId).toBe('t2');
      expect(calculated[1].placement).toBe(2);
      expect(calculated[2].teamId).toBe('t3');
      expect(calculated[2].placement).toBe(3);
    });
  });
});
