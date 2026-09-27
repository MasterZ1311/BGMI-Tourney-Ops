import { describe, it, expect } from 'vitest';
import { detectMatchConflicts } from '../lib/tournament/engine';
import { RoomUpdateSchema, AttendanceMarkSchema } from '../lib/validation/schemas';
import { checkPermission, ROLE_PERMISSIONS, Role } from '../lib/auth/roles';

describe('BGMI Rooms & Attendance Domain - Unit & Security Tests', () => {
  describe('Room Conflict & Double Booking Detection', () => {
    const baseTime = new Date('2026-09-27T18:00:00.000Z');

    it('should alert on room double-booking during overlapping matches', () => {
      const matches = [
        {
          id: 'match_1',
          scheduledStartTime: baseTime,
          durationMinutes: 45,
          roomId: 'custom_room_alpha',
        },
        {
          id: 'match_2',
          scheduledStartTime: new Date(baseTime.getTime() + 30 * 60 * 1000), // starts before match 1 finishes
          durationMinutes: 45,
          roomId: 'custom_room_alpha',
        },
      ];

      const check = detectMatchConflicts(matches);
      expect(check.hasConflict).toBe(true);
      expect(check.conflicts.some((c) => c.includes('Room double-booked: Room custom_room_alpha'))).toBe(true);
    });

    it('should allow the same room ID when scheduled sequentially with sufficient buffer', () => {
      const matches = [
        {
          id: 'match_1',
          scheduledStartTime: baseTime,
          durationMinutes: 30,
          roomId: 'custom_room_alpha',
        },
        {
          id: 'match_2',
          scheduledStartTime: new Date(baseTime.getTime() + 40 * 60 * 1000), // starts 10m after match 1 ends
          durationMinutes: 30,
          roomId: 'custom_room_alpha',
        },
      ];

      const check = detectMatchConflicts(matches);
      expect(check.hasConflict).toBe(false);
    });
  });

  describe('Room Update Schema Validation (RoomUpdateSchema)', () => {
    it('should validate valid room credentials and status', () => {
      const validRoom = {
        roomId: '88990011',
        password: 'bgmi_secret_pw',
        status: 'READY' as const,
      };

      const parsed = RoomUpdateSchema.safeParse(validRoom);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.roomId).toBe('88990011');
        expect(parsed.data.password).toBe('bgmi_secret_pw');
        expect(parsed.data.status).toBe('READY');
      }
    });

    it('should reject invalid room operational status values', () => {
      const invalidStatus = {
        roomId: '88990011',
        status: 'NON_EXISTENT_STATE',
      };

      const parsed = RoomUpdateSchema.safeParse(invalidStatus);
      expect(parsed.success).toBe(false);
    });
  });

  describe('Room Password Concealment & Role-Based Permissions (RBAC)', () => {
    it('should permit SUPER_ADMIN, TOURNAMENT_ADMIN, and MATCH_ADMIN to see room passwords', () => {
      expect(checkPermission('SUPER_ADMIN', 'canSeeRoomPasswords')).toBe(true);
      expect(checkPermission('TOURNAMENT_ADMIN', 'canSeeRoomPasswords')).toBe(true);
      expect(checkPermission('MATCH_ADMIN', 'canSeeRoomPasswords')).toBe(true);
    });

    it('should strictly prohibit SCOREKEEPER and OBSERVER from viewing room passwords', () => {
      expect(checkPermission('SCOREKEEPER', 'canSeeRoomPasswords')).toBe(false);
      expect(checkPermission('OBSERVER', 'canSeeRoomPasswords')).toBe(false);
    });

    it('should only allow administrators to manage rooms', () => {
      expect(checkPermission('SUPER_ADMIN', 'canManageRooms')).toBe(true);
      expect(checkPermission('TOURNAMENT_ADMIN', 'canManageRooms')).toBe(true);
      expect(checkPermission('MATCH_ADMIN', 'canManageRooms')).toBe(true);
      expect(checkPermission('SCOREKEEPER', 'canManageRooms')).toBe(false);
      expect(checkPermission('OBSERVER', 'canManageRooms')).toBe(false);
    });
  });

  describe('Attendance Schema & Status Validation (AttendanceMarkSchema)', () => {
    it('should accept valid attendance statuses', () => {
      const validStatuses = ['PRESENT', 'ABSENT', 'LATE', 'DISQUALIFIED', 'WITHDRAWN'] as const;

      for (const status of validStatuses) {
        const payload = {
          teamId: 'team_soul',
          matchId: 'match_101',
          status,
          checkedInBy: 'Head Marshal',
        };

        const result = AttendanceMarkSchema.safeParse(payload);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.status).toBe(status);
        }
      }
    });

    it('should reject attendance entry with missing or empty teamId', () => {
      const payload = {
        teamId: '',
        status: 'PRESENT',
      };

      const result = AttendanceMarkSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject unknown attendance status string', () => {
      const payload = {
        teamId: 'team_godl',
        status: 'CHECKED_IN', // Not in enum
      };

      const result = AttendanceMarkSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });
});
