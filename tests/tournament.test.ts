import { describe, it, expect } from 'vitest';
import {
  distributeTeamsToGroups,
  generateMatchSchedule,
  detectMatchConflicts,
  auditTournamentFinalization,
} from '../lib/tournament/engine';

describe('BGMI Tournament Engine - Unit Tests', () => {
  describe('Group Allocation & Deterministic Seeding', () => {
    const teams = Array.from({ length: 16 }, (_, i) => ({
      id: `team_${i + 1}`,
      name: `Team ${i + 1}`,
    }));

    it('should evenly divide 16 teams across 4 groups (4 per group)', () => {
      const groups = distributeTeamsToGroups({
        tournamentId: 't1',
        groupCount: 4,
        teams,
        seed: 42,
      });

      expect(groups.size).toBe(4);
      for (let g = 0; g < 4; g++) {
        expect(groups.get(g)?.length).toBe(4);
      }
    });

    it('should be deterministic when given the same seed', () => {
      const run1 = distributeTeamsToGroups({
        tournamentId: 't1',
        groupCount: 4,
        teams,
        seed: 12345,
      });
      const run2 = distributeTeamsToGroups({
        tournamentId: 't1',
        groupCount: 4,
        teams,
        seed: 12345,
      });

      for (let g = 0; g < 4; g++) {
        const t1Ids = run1.get(g)?.map((t) => t.id);
        const t2Ids = run2.get(g)?.map((t) => t.id);
        expect(t1Ids).toEqual(t2Ids);
      }
    });
  });

  describe('Match Schedule Generation', () => {
    it('should generate requested number of matches with rotating maps and calculated start times', () => {
      const startTime = new Date('2026-09-27T18:00:00.000Z');
      const slots = generateMatchSchedule({
        tournamentId: 't1',
        matchCount: 4,
        startTime,
        matchDurationMinutes: 30,
        breakDurationMinutes: 10,
        maps: ['ERANGEL', 'MIRAMAR', 'SANHOK', 'VIKENDI'],
      });

      expect(slots.length).toBe(4);
      expect(slots[0].matchNumber).toBe(1);
      expect(slots[0].map).toBe('ERANGEL');
      expect(slots[0].scheduledStartTime.toISOString()).toBe('2026-09-27T18:00:00.000Z');

      // Next match should be +40 minutes (30 match + 10 break)
      expect(slots[1].matchNumber).toBe(2);
      expect(slots[1].map).toBe('MIRAMAR');
      expect(slots[1].scheduledStartTime.toISOString()).toBe('2026-09-27T18:40:00.000Z');
    });
  });

  describe('Room Conflict & Double Booking Detection', () => {
    it('should detect when two matches overlap in the same room', () => {
      const baseTime = new Date('2026-09-27T18:00:00.000Z');
      const matches = [
        {
          id: '1',
          scheduledStartTime: baseTime,
          durationMinutes: 40,
          roomId: 'room_alpha',
        },
        {
          id: '2',
          // Starts 20 minutes later (overlaps with match 1)
          scheduledStartTime: new Date(baseTime.getTime() + 20 * 60 * 1000),
          durationMinutes: 40,
          roomId: 'room_alpha',
        },
      ];

      const result = detectMatchConflicts(matches);
      expect(result.hasConflict).toBe(true);
      expect(result.conflicts.length).toBe(1);
      expect(result.conflicts[0]).toContain('Room double-booked');
    });

    it('should report no conflict if matches are scheduled sequentially with buffer', () => {
      const baseTime = new Date('2026-09-27T18:00:00.000Z');
      const matches = [
        {
          id: '1',
          scheduledStartTime: baseTime,
          durationMinutes: 30,
          roomId: 'room_alpha',
        },
        {
          id: '2',
          // Starts 45 minutes later (no overlap)
          scheduledStartTime: new Date(baseTime.getTime() + 45 * 60 * 1000),
          durationMinutes: 30,
          roomId: 'room_alpha',
        },
      ];

      const result = detectMatchConflicts(matches);
      expect(result.hasConflict).toBe(false);
      expect(result.conflicts.length).toBe(0);
    });
  });

  describe('Tournament Finalization Pre-Flight Audit', () => {
    it('should fail finalization if matches are incomplete or results unverified', () => {
      const audit = auditTournamentFinalization({
        totalMatches: 4,
        completedMatches: 3, // Incomplete
        verifiedResults: 2,  // Unverified
        openDisputesCount: 0,
        activeTeamsCount: 16,
      });

      expect(audit.canFinalize).toBe(false);
      const matchesCheck = audit.checklist.find((c) => c.id === 'matches_complete');
      expect(matchesCheck?.passed).toBe(false);
    });

    it('should fail finalization if unresolved disputes exist', () => {
      const audit = auditTournamentFinalization({
        totalMatches: 4,
        completedMatches: 4,
        verifiedResults: 4,
        openDisputesCount: 2, // Open disputes
        activeTeamsCount: 16,
      });

      expect(audit.canFinalize).toBe(false);
      const disputeCheck = audit.checklist.find((c) => c.id === 'disputes_resolved');
      expect(disputeCheck?.passed).toBe(false);
    });

    it('should pass finalization when all checklist conditions are satisfied', () => {
      const audit = auditTournamentFinalization({
        totalMatches: 4,
        completedMatches: 4,
        verifiedResults: 4,
        openDisputesCount: 0,
        activeTeamsCount: 16,
      });

      expect(audit.canFinalize).toBe(true);
      expect(audit.checklist.every((c) => c.passed)).toBe(true);
    });
  });
});
