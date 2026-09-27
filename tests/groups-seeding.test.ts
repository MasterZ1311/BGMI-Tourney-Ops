import { describe, it, expect } from 'vitest';
import {
  distributeTeamsToGroups,
  generateBalancedGroups,
  shuffleArray,
  pseudoRandom,
} from '../lib/tournament/engine';

describe('BGMI Groups & Seeding Domain - Unit Tests', () => {
  const generateTeams = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      id: `t_${i + 1}`,
      name: `Esports Squad ${i + 1}`,
    }));

  describe('Seeded Pseudo-Random Generator (Mulberry32)', () => {
    it('should generate deterministic sequence of numbers for a fixed seed', () => {
      const rng1 = pseudoRandom(1337);
      const rng2 = pseudoRandom(1337);

      const seq1 = [rng1(), rng1(), rng1()];
      const seq2 = [rng2(), rng2(), rng2()];

      expect(seq1).toEqual(seq2);
    });

    it('should shuffle array deterministically when seed is provided', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const shuffled1 = shuffleArray(arr, 999);
      const shuffled2 = shuffleArray(arr, 999);

      expect(shuffled1).toEqual(shuffled2);
      expect(shuffled1).not.toEqual(arr);
    });
  });

  describe('Balanced Group Distribution (distributeTeamsToGroups)', () => {
    it('should evenly divide 16 teams across 4 groups (4 per group)', () => {
      const teams = generateTeams(16);
      const groups = distributeTeamsToGroups({
        tournamentId: 'tourney_1',
        groupCount: 4,
        teams,
        seed: 42,
      });

      expect(groups.size).toBe(4);
      for (let g = 0; g < 4; g++) {
        expect(groups.get(g)?.length).toBe(4);
      }
    });

    it('should evenly divide 24 teams across 3 groups (8 per group)', () => {
      const teams = generateTeams(24);
      const groups = distributeTeamsToGroups({
        tournamentId: 'tourney_1',
        groupCount: 3,
        teams,
        seed: 101,
      });

      expect(groups.size).toBe(3);
      for (let g = 0; g < 3; g++) {
        expect(groups.get(g)?.length).toBe(8);
      }
    });

    it('should handle uneven team counts gracefully', () => {
      const teams = generateTeams(17);
      const groups = distributeTeamsToGroups({
        tournamentId: 'tourney_1',
        groupCount: 4,
        teams,
        seed: 77,
      });

      // 17 teams / 4 groups => Group 0 has 5 teams, Groups 1-3 have 4 teams
      expect(groups.get(0)?.length).toBe(5);
      expect(groups.get(1)?.length).toBe(4);
      expect(groups.get(2)?.length).toBe(4);
      expect(groups.get(3)?.length).toBe(4);
    });

    it('should throw an error if groupCount is zero or negative', () => {
      const teams = generateTeams(16);
      expect(() =>
        distributeTeamsToGroups({
          tournamentId: 'tourney_1',
          groupCount: 0,
          teams,
        })
      ).toThrow('Group count must be greater than 0.');
    });

    it('should throw an error and protect against reshuffling when isLocked is true', () => {
      const teams = generateTeams(16);
      expect(() =>
        distributeTeamsToGroups({
          tournamentId: 'tourney_1',
          groupCount: 4,
          teams,
          isLocked: true,
        })
      ).toThrow('Cannot randomize teams while groups are locked. Unlock them first.');
    });

    it('should throw an error if any individual group has isLocked: true', () => {
      const teams = generateTeams(16);
      expect(() =>
        distributeTeamsToGroups({
          tournamentId: 'tourney_1',
          groupCount: 4,
          teams,
          groups: [
            { id: 'g1', name: 'Group A', isLocked: false },
            { id: 'g2', name: 'Group B', isLocked: true },
          ],
        })
      ).toThrow('Cannot randomize teams while groups are locked. Unlock them first.');
    });
  });

  describe('Balanced Group Metadata Generation (generateBalancedGroups)', () => {
    it('should assign standard group names, team objects, and teamIds array', () => {
      const teams = generateTeams(16);
      const balanced = generateBalancedGroups({
        tournamentId: 'tourney_1',
        groupCount: 4,
        teams,
        seed: 50,
      });

      expect(balanced.length).toBe(4);
      expect(balanced[0].name).toBe('Group A');
      expect(balanced[1].name).toBe('Group B');
      expect(balanced[2].name).toBe('Group C');
      expect(balanced[3].name).toBe('Group D');

      for (const group of balanced) {
        expect(group.teams.length).toBe(4);
        expect(group.teamIds.length).toBe(4);
        expect(group.teamIds).toEqual(group.teams.map((t) => t.id));
      }
    });

    it('should respect custom group names from existing groups if provided', () => {
      const teams = generateTeams(8);
      const balanced = generateBalancedGroups({
        tournamentId: 'tourney_1',
        groupCount: 2,
        teams,
        seed: 12,
        groups: [
          { id: 'grp_red', name: 'Red Division', isLocked: false },
          { id: 'grp_blue', name: 'Blue Division', isLocked: false },
        ],
      });

      expect(balanced[0].groupId).toBe('grp_red');
      expect(balanced[0].name).toBe('Red Division');
      expect(balanced[1].groupId).toBe('grp_blue');
      expect(balanced[1].name).toBe('Blue Division');
    });
  });
});
