import { describe, it, expect } from 'vitest';
import { TeamCreateSchema } from '../lib/validation/schemas';
import { exportRostersToCsv } from '../lib/export/formatters';

describe('BGMI Teams & Rosters Domain - Unit & Validation Tests', () => {
  describe('Team Registration Validation (TeamCreateSchema)', () => {
    it('should successfully validate a complete team registration payload', () => {
      const validPayload = {
        name: 'Team Soul',
        tag: 'SOUL',
        logoUrl: 'https://example.com/soul.png',
        captainName: 'Manya',
        captainPhone: '+919876543210',
        captainEmail: 'manya@soul.esports',
        players: [
          {
            name: 'Mohammad Manya',
            ign: 'SOULManya',
            characterId: '5123456789',
            role: 'CAPTAIN' as const,
            isSubstitute: false,
            isVerified: true,
          },
          {
            name: 'Nakul Sharma',
            ign: 'SOULNakul',
            characterId: '5123456790',
            role: 'ASSAULTER' as const,
            isSubstitute: false,
            isVerified: true,
          },
          {
            name: 'Khush Singh',
            ign: 'SOULJoker',
            characterId: '5123456791',
            role: 'SUPPORT' as const,
            isSubstitute: false,
            isVerified: true,
          },
          {
            name: 'Rony Pathak',
            ign: 'SOULRony',
            characterId: '5123456792',
            role: 'IGL' as const,
            isSubstitute: true,
            isVerified: true,
          },
        ],
      };

      const parsed = TeamCreateSchema.safeParse(validPayload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.name).toBe('Team Soul');
        expect(parsed.data.tag).toBe('SOUL');
        expect(parsed.data.players?.length).toBe(4);
      }
    });

    it('should reject team with name shorter than 2 characters', () => {
      const invalid = {
        name: 'X',
        tag: 'TAG',
      };
      const result = TeamCreateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('name'))).toBe(true);
      }
    });

    it('should reject team tag with fewer than 2 or more than 6 characters', () => {
      const tooShort = { name: 'Alpha', tag: 'A' };
      const tooLong = { name: 'Alpha', tag: 'TOOLONG' };

      expect(TeamCreateSchema.safeParse(tooShort).success).toBe(false);
      expect(TeamCreateSchema.safeParse(tooLong).success).toBe(false);
    });

    it('should reject player with characterId shorter than 5 digits', () => {
      const invalidPlayer = {
        name: 'GodLike',
        tag: 'GODL',
        players: [
          {
            name: 'Jonathan',
            ign: 'JONATHAN',
            characterId: '123', // Invalid (< 5 digits)
            role: 'ASSAULTER' as const,
          },
        ],
      };

      const result = TeamCreateSchema.safeParse(invalidPlayer);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('characterId'))).toBe(true);
      }
    });

    it('should reject invalid captain email format when provided', () => {
      const invalidEmail = {
        name: 'Team X',
        tag: 'TMX',
        captainEmail: 'not-an-email',
      };
      const result = TeamCreateSchema.safeParse(invalidEmail);
      expect(result.success).toBe(false);
    });

    it('should allow empty string for optional captain email and logo URL', () => {
      const validEmptyOptionals = {
        name: 'Team X',
        tag: 'TMX',
        captainEmail: '',
        logoUrl: '',
      };
      const result = TeamCreateSchema.safeParse(validEmptyOptionals);
      expect(result.success).toBe(true);
    });
  });

  describe('CSV Roster Export Formatter (exportRostersToCsv)', () => {
    it('should format roster lists into standard CSV with correct column headers', () => {
      const teamsData = [
        {
          name: 'GodLike Esports',
          tag: 'GODL',
          captainName: 'Jonathan',
          players: [
            {
              name: 'Jonathan Amaral',
              ign: 'GODLJonathan',
              characterId: '5111223344',
              role: 'ASSAULTER',
              isSubstitute: false,
            },
            {
              name: 'Suraj Majumdar',
              ign: 'GODLNeyoo',
              characterId: '5111223345',
              role: 'SUPPORT',
              isSubstitute: true,
            },
          ],
        },
      ];

      const csv = exportRostersToCsv(teamsData);
      expect(csv).toContain('Team Name,Tag,Captain Name,Player Name,IGN,Character ID,Role,Type');
      expect(csv).toContain('GodLike Esports,GODL,Jonathan,Jonathan Amaral,GODLJonathan,5111223344,ASSAULTER,Starting Lineup');
      expect(csv).toContain('GodLike Esports,GODL,Jonathan,Suraj Majumdar,GODLNeyoo,5111223345,SUPPORT,Substitute');
    });
  });
});
