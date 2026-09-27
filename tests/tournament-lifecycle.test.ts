import { describe, it, expect } from 'vitest';
import { TournamentCreateSchema } from '../lib/validation/schemas';
import {
  isValidTournamentTransition,
  validateTournamentTransition,
  getNextAllowedTournamentStatuses,
  auditTournamentFinalization,
} from '../lib/tournament/engine';
import { TournamentStatus } from '../lib/tournament/types';

describe('BGMI Tournament Domain - Lifecycle & Validation Tests', () => {
  describe('Tournament Creation Schema (TournamentCreateSchema)', () => {
    it('should validate complete tournament setup payload with default settings', () => {
      const payload = {
        name: 'Battlegrounds Masters Series 2026',
        organizer: 'Nodwin Gaming',
        description: 'Premier national BGMI tournament',
        format: 'GROUPS_AND_FINALS' as const,
        startDate: '2026-10-01T10:00:00.000Z',
        endDate: '2026-10-05T20:00:00.000Z',
        venue: 'Delhi Indoor Stadium',
        contactEmail: 'tournaments@nodwin.com',
        settings: {
          totalTeamsCap: 64,
          squadSize: 4,
          substitutesCap: 2,
          maxTeamsPerGroup: 16,
          matchDurationMinutes: 30,
          breakDurationMinutes: 15,
          noShowGraceMinutes: 10,
          disputeWindowMinutes: 15,
          allowSubstitutions: true,
        },
      };

      const result = TournamentCreateSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Battlegrounds Masters Series 2026');
        expect(result.data.settings?.squadSize).toBe(4);
      }
    });

    it('should reject tournament name with fewer than 3 characters', () => {
      const invalid = {
        name: 'BG',
        organizer: 'Krafton',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      };

      const result = TournamentCreateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('name'))).toBe(true);
      }
    });

    it('should reject missing organizer name', () => {
      const invalid = {
        name: 'BGMI Champions Cup',
        organizer: '',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      };

      const result = TournamentCreateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('Tournament Operational State Machine & Contextual Guards', () => {
    it('should permit canonical sequential tournament lifecycle transitions', () => {
      const lifecycle: TournamentStatus[] = [
        'DRAFT',
        'REGISTRATION',
        'CHECK_IN',
        'GROUPS_LOCKED',
        'SCHEDULED',
        'LIVE',
        'RESULTS_REVIEW',
        'COMPLETED',
        'ARCHIVED',
      ];

      for (let i = 0; i < lifecycle.length - 1; i++) {
        const from = lifecycle[i];
        const to = lifecycle[i + 1];

        expect(isValidTournamentTransition(from, to)).toBe(true);
      }
    });

    it('should disallow illegal status jumps (e.g. DRAFT -> LIVE)', () => {
      expect(isValidTournamentTransition('DRAFT', 'LIVE')).toBe(false);
      const res = validateTournamentTransition('DRAFT', 'LIVE');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Invalid tournament state transition');
    });

    it('should guard REGISTRATION -> CHECK_IN requiring minimum teams cap', () => {
      const guardFail = validateTournamentTransition('REGISTRATION', 'CHECK_IN', {
        registeredTeamsCount: 12,
        minTeams: 16,
      });
      expect(guardFail.valid).toBe(false);
      expect(guardFail.error).toContain('At least 16 teams required');

      const guardPass = validateTournamentTransition('REGISTRATION', 'CHECK_IN', {
        registeredTeamsCount: 16,
        minTeams: 16,
      });
      expect(guardPass.valid).toBe(true);
    });

    it('should guard CHECK_IN -> GROUPS_LOCKED requiring groups to be configured', () => {
      const guardFail = validateTournamentTransition('CHECK_IN', 'GROUPS_LOCKED', {
        groupsConfigured: false,
      });
      expect(guardFail.valid).toBe(false);
      expect(guardFail.error).toContain('Groups must be configured');

      const guardPass = validateTournamentTransition('CHECK_IN', 'GROUPS_LOCKED', {
        groupsConfigured: true,
      });
      expect(guardPass.valid).toBe(true);
    });

    it('should guard GROUPS_LOCKED -> SCHEDULED requiring groups to be locked', () => {
      const guardFail = validateTournamentTransition('GROUPS_LOCKED', 'SCHEDULED', {
        groupsLocked: false,
      });
      expect(guardFail.valid).toBe(false);
      expect(guardFail.error).toContain('Groups must be locked first');

      const guardPass = validateTournamentTransition('GROUPS_LOCKED', 'SCHEDULED', {
        groupsLocked: true,
      });
      expect(guardPass.valid).toBe(true);
    });

    it('should guard SCHEDULED -> LIVE requiring initialized rooms', () => {
      const guardFail = validateTournamentTransition('SCHEDULED', 'LIVE', {
        hasInitializedRooms: false,
      });
      expect(guardFail.valid).toBe(false);
      expect(guardFail.error).toContain('Rooms must be initialized');

      const guardPass = validateTournamentTransition('SCHEDULED', 'LIVE', {
        hasInitializedRooms: true,
      });
      expect(guardPass.valid).toBe(true);
    });

    it('should treat ARCHIVED as terminal status with no next allowed transitions', () => {
      expect(getNextAllowedTournamentStatuses('ARCHIVED')).toEqual([]);
    });
  });

  describe('Comprehensive Finalization Pre-Flight Audit Checklist', () => {
    it('should evaluate extended checklist parameters (penalties, ties)', () => {
      const auditWithPendingPenalties = auditTournamentFinalization({
        totalMatches: 4,
        completedMatches: 4,
        verifiedResults: 4,
        openDisputesCount: 0,
        activeTeamsCount: 16,
        unconfirmedPenaltiesCount: 2,
        unresolvedTiesCount: 0,
      });

      expect(auditWithPendingPenalties.canFinalize).toBe(false);
      const penaltyItem = auditWithPendingPenalties.checklist.find((c) => c.id === 'penalties_confirmed');
      expect(penaltyItem?.passed).toBe(false);

      const auditAllPassed = auditTournamentFinalization({
        totalMatches: 4,
        completedMatches: 4,
        verifiedResults: 4,
        openDisputesCount: 0,
        activeTeamsCount: 16,
        unconfirmedPenaltiesCount: 0,
        unresolvedTiesCount: 0,
      });

      expect(auditAllPassed.canFinalize).toBe(true);
      expect(auditAllPassed.checklist.every((c) => c.passed)).toBe(true);
    });
  });
});
