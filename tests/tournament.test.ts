import { describe, it, expect } from 'vitest';
import {
  distributeTeamsToGroups,
  generateBalancedGroups,
  generateMatchSchedule,
  detectMatchConflicts,
  detectSchedulingConflicts,
  isValidTournamentTransition,
  validateTournamentTransition,
  getNextAllowedTournamentStatuses,
  isValidMatchTransition,
  validateMatchTransition,
  getNextAllowedMatchStatuses,
  auditTournamentFinalization,
  STANDARD_BGMI_MAPS,
} from '../lib/tournament/engine';
import { TournamentStatus, MatchOperationalStatus } from '../lib/tournament/types';

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

    it('should correctly handle uneven team counts across groups', () => {
      const seventeenTeams = Array.from({ length: 17 }, (_, i) => ({
        id: `team_${i + 1}`,
        name: `Team ${i + 1}`,
      }));

      const groups = distributeTeamsToGroups({
        tournamentId: 't1',
        groupCount: 3,
        teams: seventeenTeams,
        seed: 77,
      });

      expect(groups.size).toBe(3);
      const totalAllocated =
        (groups.get(0)?.length || 0) +
        (groups.get(1)?.length || 0) +
        (groups.get(2)?.length || 0);
      expect(totalAllocated).toBe(17);
      expect(groups.get(0)?.length).toBe(6);
      expect(groups.get(1)?.length).toBe(6);
      expect(groups.get(2)?.length).toBe(5);
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

    it('should produce different distribution with different seeds', () => {
      const run1 = distributeTeamsToGroups({
        tournamentId: 't1',
        groupCount: 4,
        teams,
        seed: 100,
      });
      const run2 = distributeTeamsToGroups({
        tournamentId: 't1',
        groupCount: 4,
        teams,
        seed: 9999,
      });

      const run1Order = Array.from(run1.values()).flatMap((g) => g.map((t) => t.id));
      const run2Order = Array.from(run2.values()).flatMap((g) => g.map((t) => t.id));
      expect(run1Order).not.toEqual(run2Order);
    });

    it('should respect group locking guard and reject redistribution when isLocked is true', () => {
      expect(() => {
        distributeTeamsToGroups({
          tournamentId: 't1',
          groupCount: 4,
          teams,
          seed: 42,
          isLocked: true,
        });
      }).toThrow('Cannot randomize teams while groups are locked');
    });

    it('should respect individual group lock status in groups metadata', () => {
      expect(() => {
        distributeTeamsToGroups({
          tournamentId: 't1',
          groupCount: 2,
          teams,
          seed: 42,
          groups: [
            { id: 'g1', name: 'Group A', isLocked: false },
            { id: 'g2', name: 'Group B', isLocked: true },
          ],
        });
      }).toThrow('Cannot randomize teams while groups are locked');
    });

    it('generateBalancedGroups should return structured groups with metadata and teamIds', () => {
      const balanced = generateBalancedGroups({
        tournamentId: 't1',
        groupCount: 2,
        teams: teams.slice(0, 8),
        seed: 55,
        groups: [
          { id: 'grp_1', name: 'Alpha Bracket' },
          { id: 'grp_2', name: 'Bravo Bracket' },
        ],
      });

      expect(balanced.length).toBe(2);
      expect(balanced[0].name).toBe('Alpha Bracket');
      expect(balanced[0].groupId).toBe('grp_1');
      expect(balanced[0].teams.length).toBe(4);
      expect(balanced[0].teamIds.length).toBe(4);
      expect(balanced[1].name).toBe('Bravo Bracket');
      expect(balanced[1].groupId).toBe('grp_2');
      expect(balanced[1].teams.length).toBe(4);
    });

    it('should reject non-positive groupCount', () => {
      expect(() => {
        distributeTeamsToGroups({
          tournamentId: 't1',
          groupCount: 0,
          teams,
        });
      }).toThrow('Group count must be greater than 0');
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

      expect(slots[2].matchNumber).toBe(3);
      expect(slots[2].map).toBe('SANHOK');
      expect(slots[2].scheduledStartTime.toISOString()).toBe('2026-09-27T19:20:00.000Z');

      expect(slots[3].matchNumber).toBe(4);
      expect(slots[3].map).toBe('VIKENDI');
      expect(slots[3].scheduledStartTime.toISOString()).toBe('2026-09-27T20:00:00.000Z');
    });

    it('should cycle standard BGMI maps when match count exceeds map count', () => {
      const startTime = new Date('2026-09-27T18:00:00.000Z');
      const slots = generateMatchSchedule({
        tournamentId: 't1',
        matchCount: 6,
        startTime,
        matchDurationMinutes: 35,
        breakDurationMinutes: 10,
      });

      expect(slots.length).toBe(6);
      expect(slots.map((s) => s.map)).toEqual([
        'ERANGEL',
        'MIRAMAR',
        'SANHOK',
        'VIKENDI',
        'ERANGEL',
        'MIRAMAR',
      ]);
    });

    it('should support RONDO in custom map list and cycle properly', () => {
      const startTime = new Date('2026-09-27T18:00:00.000Z');
      const slots = generateMatchSchedule({
        tournamentId: 't1',
        matchCount: 5,
        startTime,
        matchDurationMinutes: 30,
        breakDurationMinutes: 10,
        maps: ['ERANGEL', 'MIRAMAR', 'SANHOK', 'VIKENDI', 'RONDO'],
      });

      expect(slots.length).toBe(5);
      expect(slots[4].map).toBe('RONDO');
      expect(slots[4].title).toContain('RONDO');
    });

    it('should cycle group IDs across matches if provided', () => {
      const startTime = new Date('2026-09-27T18:00:00.000Z');
      const slots = generateMatchSchedule({
        tournamentId: 't1',
        matchCount: 4,
        startTime,
        matchDurationMinutes: 30,
        breakDurationMinutes: 10,
        groupIds: ['grp_a', 'grp_b'],
      });

      expect(slots[0].groupId).toBe('grp_a');
      expect(slots[1].groupId).toBe('grp_b');
      expect(slots[2].groupId).toBe('grp_a');
      expect(slots[3].groupId).toBe('grp_b');
      expect(slots[0].title).toContain('(Group)');
    });

    it('should return empty slots array if matchCount is 0 or negative', () => {
      const slots = generateMatchSchedule({
        tournamentId: 't1',
        matchCount: 0,
        startTime: new Date(),
        matchDurationMinutes: 30,
        breakDurationMinutes: 10,
      });
      expect(slots).toEqual([]);
    });

    it('should respect custom perspective setting (FPP vs TPP)', () => {
      const slots = generateMatchSchedule({
        tournamentId: 't1',
        matchCount: 1,
        startTime: new Date(),
        matchDurationMinutes: 30,
        breakDurationMinutes: 10,
        perspective: 'FPP',
      });
      expect(slots[0].perspective).toBe('FPP');
    });
  });

  describe('Conflict & Concurrency Detection', () => {
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

    it('should detect when a team is scheduled to play in two overlapping matches', () => {
      const baseTime = new Date('2026-09-27T18:00:00.000Z');
      const matches = [
        {
          id: 'm1',
          scheduledStartTime: baseTime,
          durationMinutes: 40,
          roomId: 'room_alpha',
          teamIds: ['team_soul', 'team_godl'],
        },
        {
          id: 'm2',
          scheduledStartTime: new Date(baseTime.getTime() + 15 * 60 * 1000),
          durationMinutes: 40,
          roomId: 'room_bravo',
          teamIds: ['team_soul', 'team_tx'], // team_soul is in both during overlap!
        },
      ];

      const result = detectMatchConflicts(matches);
      expect(result.hasConflict).toBe(true);
      expect(result.conflicts.some((c) => c.includes('Team concurrency conflict'))).toBe(true);
      expect(result.conflicts.some((c) => c.includes('team_soul'))).toBe(true);
    });

    it('should detect when the same group is assigned to overlapping matches', () => {
      const baseTime = new Date('2026-09-27T18:00:00.000Z');
      const matches = [
        {
          id: 'm1',
          scheduledStartTime: baseTime,
          durationMinutes: 45,
          roomId: 'room_a',
          groupId: 'grp_alpha',
        },
        {
          id: 'm2',
          scheduledStartTime: new Date(baseTime.getTime() + 30 * 60 * 1000),
          durationMinutes: 45,
          roomId: 'room_b',
          groupId: 'grp_alpha',
        },
      ];

      const result = detectMatchConflicts(matches);
      expect(result.hasConflict).toBe(true);
      expect(result.conflicts.some((c) => c.includes('Group concurrency conflict'))).toBe(true);
    });

    it('should report no conflict if matches are scheduled sequentially with buffer', () => {
      const baseTime = new Date('2026-09-27T18:00:00.000Z');
      const matches = [
        {
          id: '1',
          scheduledStartTime: baseTime,
          durationMinutes: 30,
          roomId: 'room_alpha',
          teamIds: ['team_soul'],
        },
        {
          id: '2',
          // Starts 45 minutes later (no overlap)
          scheduledStartTime: new Date(baseTime.getTime() + 45 * 60 * 1000),
          durationMinutes: 30,
          roomId: 'room_alpha',
          teamIds: ['team_soul'],
        },
      ];

      const result = detectMatchConflicts(matches);
      expect(result.hasConflict).toBe(false);
      expect(result.conflicts.length).toBe(0);
    });

    it('should report no conflict if overlapping matches have distinct rooms and distinct teams', () => {
      const baseTime = new Date('2026-09-27T18:00:00.000Z');
      const matches = [
        {
          id: '1',
          scheduledStartTime: baseTime,
          durationMinutes: 30,
          roomId: 'room_alpha',
          teamIds: ['team_a', 'team_b'],
        },
        {
          id: '2',
          scheduledStartTime: baseTime,
          durationMinutes: 30,
          roomId: 'room_bravo',
          teamIds: ['team_c', 'team_d'],
        },
      ];

      const result = detectSchedulingConflicts(matches);
      expect(result.hasConflict).toBe(false);
      expect(result.conflicts.length).toBe(0);
    });

    it('should flag invalid start times and non-positive durations', () => {
      const matches = [
        {
          id: 'invalid_date',
          scheduledStartTime: new Date('invalid-date-string'),
          durationMinutes: 30,
        },
        {
          id: 'invalid_dur',
          scheduledStartTime: new Date('2026-09-27T18:00:00.000Z'),
          durationMinutes: 0,
        },
      ];

      const result = detectMatchConflicts(matches);
      expect(result.hasConflict).toBe(true);
      expect(result.conflicts.some((c) => c.includes('invalid scheduled start time'))).toBe(true);
      expect(result.conflicts.some((c) => c.includes('invalid duration'))).toBe(true);
    });

    it('should flag matches scheduled in the past when checkPastTimes is enabled', () => {
      const pastTime = new Date('2026-09-20T10:00:00.000Z');
      const now = new Date('2026-09-27T10:00:00.000Z');
      const matches = [
        {
          id: 'past_match',
          scheduledStartTime: pastTime,
          durationMinutes: 30,
        },
      ];

      const result = detectMatchConflicts(matches, { checkPastTimes: true, now });
      expect(result.hasConflict).toBe(true);
      expect(result.conflicts[0]).toContain('in the past');
    });
  });

  describe('Tournament Lifecycle State Machine Transitions', () => {
    it('should allow valid linear stage progression: DRAFT -> REGISTRATION -> CHECK_IN -> GROUPS_LOCKED -> SCHEDULED -> LIVE -> RESULTS_REVIEW -> COMPLETED -> ARCHIVED', () => {
      const validPath: TournamentStatus[] = [
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

      for (let i = 0; i < validPath.length - 1; i++) {
        const current = validPath[i];
        const next = validPath[i + 1];
        expect(isValidTournamentTransition(current, next)).toBe(true);
        const res = validateTournamentTransition(current, next);
        expect(res.valid).toBe(true);
      }
    });

    it('should allow safe rollback transitions when needed', () => {
      expect(isValidTournamentTransition('REGISTRATION', 'DRAFT')).toBe(true);
      expect(isValidTournamentTransition('CHECK_IN', 'REGISTRATION')).toBe(true);
      expect(isValidTournamentTransition('GROUPS_LOCKED', 'CHECK_IN')).toBe(true);
      expect(isValidTournamentTransition('SCHEDULED', 'GROUPS_LOCKED')).toBe(true);
      expect(isValidTournamentTransition('RESULTS_REVIEW', 'LIVE')).toBe(true);
    });

    it('should disallow illegal status jumps', () => {
      expect(isValidTournamentTransition('DRAFT', 'LIVE')).toBe(false);
      expect(isValidTournamentTransition('DRAFT', 'COMPLETED')).toBe(false);
      expect(isValidTournamentTransition('CHECK_IN', 'COMPLETED')).toBe(false);
      expect(isValidTournamentTransition('LIVE', 'DRAFT')).toBe(false);
      expect(isValidTournamentTransition('COMPLETED', 'DRAFT')).toBe(false);
      expect(isValidTournamentTransition('ARCHIVED', 'DRAFT')).toBe(false);
      expect(isValidTournamentTransition('ARCHIVED', 'LIVE')).toBe(false);

      const invalidResult = validateTournamentTransition('DRAFT', 'COMPLETED');
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.error).toContain('Invalid tournament state transition');
    });

    it('should enforce REGISTRATION -> CHECK_IN team count guard', () => {
      // Under minimum teams (e.g. 10 teams when 16 required)
      const failResult = validateTournamentTransition('REGISTRATION', 'CHECK_IN', {
        registeredTeamsCount: 10,
        minTeams: 16,
      });
      expect(failResult.valid).toBe(false);
      expect(failResult.error).toContain('At least 16 teams required');

      // Satisfied minimum teams
      const passResult = validateTournamentTransition('REGISTRATION', 'CHECK_IN', {
        registeredTeamsCount: 16,
        minTeams: 16,
      });
      expect(passResult.valid).toBe(true);
    });

    it('should enforce operational guards for GROUPS_LOCKED, SCHEDULED, and LIVE', () => {
      // Groups not configured
      const grpConfigFail = validateTournamentTransition('CHECK_IN', 'GROUPS_LOCKED', {
        groupsConfigured: false,
      });
      expect(grpConfigFail.valid).toBe(false);
      expect(grpConfigFail.error).toContain('Groups must be configured');

      // Groups not locked
      const grpLockFail = validateTournamentTransition('GROUPS_LOCKED', 'SCHEDULED', {
        groupsLocked: false,
      });
      expect(grpLockFail.valid).toBe(false);
      expect(grpLockFail.error).toContain('Groups must be locked');

      // Rooms not initialized
      const roomInitFail = validateTournamentTransition('SCHEDULED', 'LIVE', {
        hasInitializedRooms: false,
      });
      expect(roomInitFail.valid).toBe(false);
      expect(roomInitFail.error).toContain('Rooms must be initialized');

      // Matches not all finished
      const matchesFinishFail = validateTournamentTransition('LIVE', 'RESULTS_REVIEW', {
        allMatchesFinished: false,
      });
      expect(matchesFinishFail.valid).toBe(false);
      expect(matchesFinishFail.error).toContain('All live matches must be concluded');
    });

    it('should enforce pre-flight audit guard when transitioning RESULTS_REVIEW -> COMPLETED', () => {
      const failAudit = validateTournamentTransition('RESULTS_REVIEW', 'COMPLETED', {
        auditResult: {
          canFinalize: false,
          checklist: [],
        },
      });
      expect(failAudit.valid).toBe(false);
      expect(failAudit.error).toContain('pre-flight audit failed');

      const passAudit = validateTournamentTransition('RESULTS_REVIEW', 'COMPLETED', {
        auditResult: {
          canFinalize: true,
          checklist: [],
        },
      });
      expect(passAudit.valid).toBe(true);
    });

    it('getNextAllowedTournamentStatuses should return allowed targets', () => {
      const draftNext = getNextAllowedTournamentStatuses('DRAFT');
      expect(draftNext).toContain('REGISTRATION');
      expect(draftNext).toContain('ARCHIVED');

      const archivedNext = getNextAllowedTournamentStatuses('ARCHIVED');
      expect(archivedNext).toEqual([]);
    });
  });

  describe('Match Operational State Machine', () => {
    it('should validate standard match progression: SCHEDULED -> READY -> OPEN -> LIVE -> COMPLETED -> VERIFIED -> PUBLISHED', () => {
      const matchFlow: MatchOperationalStatus[] = [
        'SCHEDULED',
        'READY',
        'OPEN',
        'LIVE',
        'COMPLETED',
        'VERIFIED',
        'PUBLISHED',
      ];

      for (let i = 0; i < matchFlow.length - 1; i++) {
        expect(isValidMatchTransition(matchFlow[i], matchFlow[i + 1])).toBe(true);
        expect(validateMatchTransition(matchFlow[i], matchFlow[i + 1]).valid).toBe(true);
      }
    });

    it('should reject invalid match transitions', () => {
      expect(isValidMatchTransition('SCHEDULED', 'LIVE')).toBe(false);
      expect(isValidMatchTransition('OPEN', 'PUBLISHED')).toBe(false);
      expect(isValidMatchTransition('COMPLETED', 'READY')).toBe(false);
      expect(validateMatchTransition('SCHEDULED', 'PUBLISHED').valid).toBe(false);
    });

    it('should return allowed next statuses for match states', () => {
      const scheduledAllowed = getNextAllowedMatchStatuses('SCHEDULED');
      expect(scheduledAllowed).toEqual(['READY', 'CANCELLED']);
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
      const resultsCheck = audit.checklist.find((c) => c.id === 'results_verified');
      expect(resultsCheck?.passed).toBe(false);
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

    it('should fail finalization if active participating teams are less than 2', () => {
      const audit = auditTournamentFinalization({
        totalMatches: 1,
        completedMatches: 1,
        verifiedResults: 1,
        openDisputesCount: 0,
        activeTeamsCount: 1, // Only 1 team
      });

      expect(audit.canFinalize).toBe(false);
      const teamsCheck = audit.checklist.find((c) => c.id === 'active_teams');
      expect(teamsCheck?.passed).toBe(false);
    });

    it('should support extended check for unconfirmed penalties and unresolved ties', () => {
      const auditWithPenalties = auditTournamentFinalization({
        totalMatches: 4,
        completedMatches: 4,
        verifiedResults: 4,
        openDisputesCount: 0,
        activeTeamsCount: 16,
        unconfirmedPenaltiesCount: 1,
      });
      expect(auditWithPenalties.canFinalize).toBe(false);
      const penCheck = auditWithPenalties.checklist.find((c) => c.id === 'penalties_confirmed');
      expect(penCheck?.passed).toBe(false);

      const auditWithTies = auditTournamentFinalization({
        totalMatches: 4,
        completedMatches: 4,
        verifiedResults: 4,
        openDisputesCount: 0,
        activeTeamsCount: 16,
        unresolvedTiesCount: 2,
      });
      expect(auditWithTies.canFinalize).toBe(false);
      const tieCheck = auditWithTies.checklist.find((c) => c.id === 'tiebreakers_resolved');
      expect(tieCheck?.passed).toBe(false);
    });

    it('should support dual signature: auditTournamentFinalization(tournamentId, params)', () => {
      const audit = auditTournamentFinalization('t_bgmi_101', {
        totalMatches: 5,
        completedMatches: 5,
        verifiedResults: 5,
        openDisputesCount: 0,
        activeTeamsCount: 16,
      });

      expect(audit.canFinalize).toBe(true);
      expect(audit.checklist.every((c) => c.passed)).toBe(true);
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
