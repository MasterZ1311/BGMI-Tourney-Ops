import { describe, it, expect } from 'vitest';
import {
  generateMatchSchedule,
  detectMatchConflicts,
  isValidMatchTransition,
  validateMatchTransition,
  getNextAllowedMatchStatuses,
  STANDARD_BGMI_MAPS,
} from '../lib/tournament/engine';
import { MatchOperationalStatus } from '../lib/tournament/types';

describe('BGMI Matches & Scheduling Domain - Unit Tests', () => {
  describe('Match Schedule Generation', () => {
    it('should generate requested slots with map cycling and calculated timestamps', () => {
      const startTime = new Date('2026-09-27T18:00:00.000Z');
      const slots = generateMatchSchedule({
        tournamentId: 'tourney_bgis',
        matchCount: 6,
        startTime,
        matchDurationMinutes: 35,
        breakDurationMinutes: 15,
        perspective: 'TPP',
      });

      expect(slots.length).toBe(6);

      // Maps cycle: Erangel, Miramar, Sanhok, Vikendi, Erangel, Miramar
      expect(slots[0].map).toBe('ERANGEL');
      expect(slots[1].map).toBe('MIRAMAR');
      expect(slots[2].map).toBe('SANHOK');
      expect(slots[3].map).toBe('VIKENDI');
      expect(slots[4].map).toBe('ERANGEL');
      expect(slots[5].map).toBe('MIRAMAR');

      // Slot step: 35 + 15 = 50 minutes = 3000000 ms
      expect(slots[0].scheduledStartTime.toISOString()).toBe('2026-09-27T18:00:00.000Z');
      expect(slots[1].scheduledStartTime.toISOString()).toBe('2026-09-27T18:50:00.000Z');
      expect(slots[2].scheduledStartTime.toISOString()).toBe('2026-09-27T19:40:00.000Z');
    });

    it('should return empty array if matchCount is 0 or negative', () => {
      const slots = generateMatchSchedule({
        tournamentId: 'tourney_empty',
        matchCount: 0,
        startTime: new Date(),
        matchDurationMinutes: 30,
        breakDurationMinutes: 10,
      });
      expect(slots).toEqual([]);
    });

    it('should assign assigned groups in round-robin fashion when groupIds provided', () => {
      const slots = generateMatchSchedule({
        tournamentId: 't1',
        matchCount: 4,
        startTime: new Date(),
        matchDurationMinutes: 30,
        breakDurationMinutes: 10,
        groupIds: ['grp_a', 'grp_b'],
      });

      expect(slots[0].groupId).toBe('grp_a');
      expect(slots[1].groupId).toBe('grp_b');
      expect(slots[2].groupId).toBe('grp_a');
      expect(slots[3].groupId).toBe('grp_b');
    });
  });

  describe('Match Operational State Machine', () => {
    it('should allow canonical forward match operational progression', () => {
      const canonicalPath: MatchOperationalStatus[] = [
        'SCHEDULED',
        'READY',
        'OPEN',
        'LIVE',
        'COMPLETED',
        'VERIFIED',
        'PUBLISHED',
      ];

      for (let i = 0; i < canonicalPath.length - 1; i++) {
        const from = canonicalPath[i];
        const to = canonicalPath[i + 1];

        expect(isValidMatchTransition(from, to)).toBe(true);
        const res = validateMatchTransition(from, to);
        expect(res.valid).toBe(true);
      }
    });

    it('should permit administrative rollback from PUBLISHED to VERIFIED', () => {
      expect(isValidMatchTransition('PUBLISHED', 'VERIFIED')).toBe(true);
      const res = validateMatchTransition('PUBLISHED', 'VERIFIED');
      expect(res.valid).toBe(true);
    });

    it('should disallow invalid non-sequential transitions', () => {
      expect(isValidMatchTransition('SCHEDULED', 'LIVE')).toBe(false);
      expect(isValidMatchTransition('SCHEDULED', 'PUBLISHED')).toBe(false);
      expect(isValidMatchTransition('COMPLETED', 'OPEN')).toBe(false);

      const invalidRes = validateMatchTransition('SCHEDULED', 'PUBLISHED');
      expect(invalidRes.valid).toBe(false);
      expect(invalidRes.error).toContain('Invalid match state transition');
    });

    it('should treat CANCELLED as a terminal match status with no allowed transitions', () => {
      const nextAllowed = getNextAllowedMatchStatuses('CANCELLED');
      expect(nextAllowed).toEqual([]);
    });
  });

  describe('Scheduling Concurrency & Conflict Detection', () => {
    const baseTime = new Date('2026-09-27T18:00:00.000Z');

    it('should detect team concurrency conflicts when a team is scheduled in overlapping matches', () => {
      const matches = [
        {
          id: 'm1',
          matchNumber: 1,
          scheduledStartTime: baseTime,
          durationMinutes: 40,
          teamIds: ['team_soul', 'team_godl'],
        },
        {
          id: 'm2',
          matchNumber: 2,
          scheduledStartTime: new Date(baseTime.getTime() + 15 * 60 * 1000), // starts +15m later (overlap)
          durationMinutes: 40,
          teamIds: ['team_soul', 'team_tx'],
        },
      ];

      const check = detectMatchConflicts(matches);
      expect(check.hasConflict).toBe(true);
      expect(check.conflicts.some((c) => c.includes('Team concurrency conflict: Team team_soul'))).toBe(true);
    });

    it('should detect group concurrency conflicts when the same group is scheduled in overlapping matches', () => {
      const matches = [
        {
          id: 'm1',
          matchNumber: 1,
          scheduledStartTime: baseTime,
          durationMinutes: 40,
          groupId: 'grp_alpha',
        },
        {
          id: 'm2',
          matchNumber: 2,
          scheduledStartTime: new Date(baseTime.getTime() + 25 * 60 * 1000),
          durationMinutes: 40,
          groupId: 'grp_alpha',
        },
      ];

      const check = detectMatchConflicts(matches);
      expect(check.hasConflict).toBe(true);
      expect(check.conflicts.some((c) => c.includes('Group concurrency conflict'))).toBe(true);
    });

    it('should reject invalid match durations (<= 0 mins)', () => {
      const matches = [
        {
          id: 'm_bad',
          scheduledStartTime: baseTime,
          durationMinutes: 0,
        },
      ];

      const check = detectMatchConflicts(matches);
      expect(check.hasConflict).toBe(true);
      expect(check.conflicts.some((c) => c.includes('invalid duration'))).toBe(true);
    });

    it('should report no conflicts when matches are non-overlapping', () => {
      const matches = [
        {
          id: 'm1',
          matchNumber: 1,
          scheduledStartTime: baseTime,
          durationMinutes: 30,
          teamIds: ['team_soul'],
          roomId: 'r1',
        },
        {
          id: 'm2',
          matchNumber: 2,
          scheduledStartTime: new Date(baseTime.getTime() + 45 * 60 * 1000),
          durationMinutes: 30,
          teamIds: ['team_soul'],
          roomId: 'r1',
        },
      ];

      const check = detectMatchConflicts(matches);
      expect(check.hasConflict).toBe(false);
      expect(check.conflicts.length).toBe(0);
    });
  });
});
