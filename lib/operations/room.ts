/**
 * BGMI Tournament Control Center — Room Coordinator Service
 * Manages in-game custom room state machine, password masking/concealment,
 * and room double-booking conflict detection.
 */

import {
  MaskedRoomEntity,
  RoomConflictCheckItem,
  RoomConflictCheckResult,
  RoomEntity,
  RoomOperationalStatus,
  RoomUpdateInput,
} from './types';
import { domainEventBus } from './events';

export const MASKED_PASSWORD_PLACEHOLDER = '••••••••';

/**
 * Valid state transitions for BGMI Custom Room lifecycle:
 * NOT_CREATED ➔ READY ➔ OPEN ➔ LIVE ➔ COMPLETED ➔ CLOSED
 */
const VALID_ROOM_TRANSITIONS: Record<RoomOperationalStatus, RoomOperationalStatus[]> = {
  NOT_CREATED: ['READY', 'CLOSED'],
  READY: ['OPEN', 'NOT_CREATED', 'CLOSED'],
  OPEN: ['LIVE', 'READY', 'CLOSED'],
  LIVE: ['COMPLETED', 'OPEN', 'CLOSED'],
  COMPLETED: ['CLOSED'],
  CLOSED: ['READY', 'NOT_CREATED'], // Can reopen or recreate if required by admin
};

/**
 * Validate room lifecycle state transitions.
 */
export function validateRoomStateTransition(
  currentStatus: RoomOperationalStatus,
  nextStatus: RoomOperationalStatus
): { valid: boolean; reason?: string } {
  if (currentStatus === nextStatus) {
    return { valid: true };
  }

  const allowed = VALID_ROOM_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    return {
      valid: false,
      reason: `Illegal room transition from ${currentStatus} to ${nextStatus}. Allowed: [${allowed.join(', ')}]`,
    };
  }

  return { valid: true };
}

/**
 * Transition room state and emit corresponding operational domain event.
 */
export function transitionRoomState(
  room: RoomEntity,
  nextStatus: RoomOperationalStatus,
  actorUserId?: string | null
): { success: boolean; room?: RoomEntity; error?: string } {
  const validation = validateRoomStateTransition(room.status, nextStatus);
  if (!validation.valid) {
    return { success: false, error: validation.reason };
  }

  const updatedRoom: RoomEntity = {
    ...room,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
  };

  // Dispatch events for key lifecycle changes
  if (nextStatus === 'OPEN') {
    domainEventBus.emit(
      'room.opened',
      'ROOM',
      room.id,
      {
        matchId: room.matchId,
        roomName: room.roomName,
        roomId: room.roomId,
        status: nextStatus,
      },
      actorUserId
    );
  } else if (nextStatus === 'CLOSED') {
    domainEventBus.emit(
      'room.closed',
      'ROOM',
      room.id,
      { matchId: room.matchId, roomName: room.roomName, status: nextStatus },
      actorUserId
    );
  }

  return { success: true, room: updatedRoom };
}

/**
 * Mask room password unless user has explicit permission (e.g. Match Admin, Super Admin).
 * Prevents password leaks to public display overlays, stream observers, or spectator feeds.
 */
export function maskRoomCredentials(
  room: RoomEntity,
  canViewPassword = false
): MaskedRoomEntity {
  const shouldMask = !canViewPassword && !!room.password;

  return {
    id: room.id,
    matchId: room.matchId,
    roomName: room.roomName,
    roomId: room.roomId ?? null,
    password: shouldMask ? MASKED_PASSWORD_PLACEHOLDER : (room.password ?? null),
    status: room.status,
    isMasked: shouldMask,
    updatedAt: room.updatedAt,
  };
}

/**
 * Public serializer shortcut: ALWAYS masks password.
 */
export function sanitizeRoomForPublic(room: RoomEntity): MaskedRoomEntity {
  return maskRoomCredentials(room, false);
}

/**
 * Sanitizes before/after states for AuditLog to guarantee passwords are never logged in plaintext.
 */
export function sanitizeRoomAuditPayload(room: RoomEntity | null | undefined): Record<string, unknown> | null {
  if (!room) return null;
  return {
    id: room.id,
    matchId: room.matchId,
    roomName: room.roomName,
    roomId: room.roomId ?? null,
    password: room.password ? '[REDACTED_PASSWORD]' : null,
    status: room.status,
  };
}

/**
 * Validate BGMI custom room credentials syntax and length.
 */
export function validateRoomCredentials(
  roomId?: string | null,
  password?: string | null
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (roomId !== undefined && roomId !== null) {
    const trimmedId = roomId.trim();
    if (trimmedId.length === 0) {
      errors.push('Room ID cannot be empty whitespace.');
    } else if (trimmedId.length < 3 || trimmedId.length > 20) {
      errors.push('Room ID must be between 3 and 20 characters.');
    }
  }

  if (password !== undefined && password !== null) {
    const trimmedPw = password.trim();
    if (trimmedPw.length === 0) {
      errors.push('Password cannot be empty whitespace.');
    } else if (trimmedPw.length < 2 || trimmedPw.length > 32) {
      errors.push('Room password must be between 2 and 32 characters.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Detect custom room double-booking collisions across scheduled matches.
 * Verifies that the same in-game Room ID is never scheduled in two concurrent or overlapping matches.
 */
export function detectRoomConflicts(
  scheduledRooms: RoomConflictCheckItem[]
): RoomConflictCheckResult {
  const conflicts: string[] = [];

  for (let i = 0; i < scheduledRooms.length; i++) {
    for (let j = i + 1; j < scheduledRooms.length; j++) {
      const r1 = scheduledRooms[i];
      const r2 = scheduledRooms[j];

      // Only check if both matches have an assigned Room ID
      if (r1.roomId && r2.roomId && r1.roomId.trim().toLowerCase() === r2.roomId.trim().toLowerCase()) {
        const start1 = new Date(r1.scheduledStartTime).getTime();
        const end1 = start1 + r1.durationMinutes * 60 * 1000;

        const start2 = new Date(r2.scheduledStartTime).getTime();
        const end2 = start2 + r2.durationMinutes * 60 * 1000;

        // Overlapping interval check: max(start1, start2) < min(end1, end2)
        if (Math.max(start1, start2) < Math.min(end1, end2)) {
          conflicts.push(
            `Room conflict: Room ID "${r1.roomId}" is assigned to both Match ${r1.matchId} and Match ${r2.matchId} during overlapping time windows.`
          );
        }
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
}

/**
 * Validate a specific proposed room assignment against already scheduled matches.
 */
export function validateRoomAssignment(
  proposedMatch: RoomConflictCheckItem,
  existingMatches: RoomConflictCheckItem[]
): { valid: boolean; conflicts: string[] } {
  if (!proposedMatch.roomId) {
    return { valid: true, conflicts: [] };
  }

  const matchesToCompare = [
    proposedMatch,
    ...existingMatches.filter((m) => m.matchId !== proposedMatch.matchId),
  ];

  const result = detectRoomConflicts(matchesToCompare);
  return {
    valid: !result.hasConflict,
    conflicts: result.conflicts,
  };
}
