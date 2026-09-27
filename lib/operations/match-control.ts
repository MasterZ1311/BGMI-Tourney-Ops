/**
 * BGMI Tournament Control Center — Match Control Service
 * Implements the match execution pipeline, pre-match readiness checklist,
 * and live match-day state machine.
 */

import {
  MatchEntity,
  MatchOperationalStatus,
  MatchSlotAssignment,
  MatchTransitionResult,
  PreMatchChecklist,
  RoomEntity,
} from './types';
import { domainEventBus } from './events';
import { transitionRoomState } from './room';

/**
 * Valid transitions for Match Execution State Machine:
 * SCHEDULED ➔ READY ➔ OPEN ➔ LIVE ➔ COMPLETED (➔ VERIFIED ➔ PUBLISHED) | CANCELLED
 */
const VALID_MATCH_TRANSITIONS: Record<MatchOperationalStatus, MatchOperationalStatus[]> = {
  SCHEDULED: ['READY', 'CANCELLED'],
  READY: ['OPEN', 'SCHEDULED', 'CANCELLED'],
  OPEN: ['LIVE', 'READY', 'CANCELLED'],
  LIVE: ['COMPLETED', 'OPEN', 'CANCELLED'],
  COMPLETED: ['VERIFIED', 'PUBLISHED', 'LIVE', 'CANCELLED'],
  VERIFIED: ['PUBLISHED', 'COMPLETED'],
  PUBLISHED: ['VERIFIED'], // Only via explicit administrative override
  CANCELLED: ['SCHEDULED'],
};

/**
 * Validate match operational status transition.
 */
export function validateMatchTransition(
  currentStatus: MatchOperationalStatus,
  nextStatus: MatchOperationalStatus
): { valid: boolean; reason?: string } {
  if (currentStatus === nextStatus) {
    return { valid: true };
  }

  const allowed = VALID_MATCH_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    return {
      valid: false,
      reason: `Illegal match transition from ${currentStatus} to ${nextStatus}. Allowed: [${allowed.join(', ')}]`,
    };
  }

  return { valid: true };
}

/**
 * Run pre-match checks verifying squad slotting, room configuration, and attendance readiness.
 */
export function validatePreMatchChecklist(params: {
  match: MatchEntity;
  slottedTeams: MatchSlotAssignment[];
  room?: RoomEntity | null;
  minTeamsRequired?: number;
}): PreMatchChecklist {
  const { match, slottedTeams, room, minTeamsRequired = 2 } = params;
  const blockers: string[] = [];
  const warnings: string[] = [];

  // 1. Slot assignment checks
  const slotNumbers = new Set<number>();
  let hasDuplicateSlot = false;

  for (const s of slottedTeams) {
    if (s.slotNumber < 1 || s.slotNumber > 25) {
      blockers.push(`Invalid slot number #${s.slotNumber} for team "${s.teamName}". Must be 1-25.`);
    }
    if (slotNumbers.has(s.slotNumber)) {
      hasDuplicateSlot = true;
      blockers.push(`Duplicate slot number #${s.slotNumber} detected for team "${s.teamName}".`);
    }
    slotNumbers.add(s.slotNumber);
  }

  const totalSlottedTeams = slottedTeams.length;
  const allSlotsAssigned = totalSlottedTeams > 0 && !hasDuplicateSlot;

  if (totalSlottedTeams < minTeamsRequired) {
    blockers.push(`Match requires at least ${minTeamsRequired} squads, but only ${totalSlottedTeams} are slotted.`);
  }

  // 2. Room checks
  const roomCreated = !!room;
  const roomCredentialsSet = !!room?.roomId && !!room?.password;

  if (!roomCreated) {
    blockers.push('Custom room record has not been generated for this match.');
  } else if (!roomCredentialsSet) {
    warnings.push('Room ID and/or Password have not been set.');
  }

  // 3. Attendance checks
  const unverifiedTeams = slottedTeams.filter((t) => t.isAttendanceVerified === false);
  const attendanceVerified = unverifiedTeams.length === 0;

  if (unverifiedTeams.length > 0) {
    warnings.push(
      `${unverifiedTeams.length} slotted squad(s) have not completed lobby attendance check-in.`
    );
  }

  const canStart = blockers.length === 0;

  return {
    matchId: match.id,
    allSlotsAssigned,
    totalSlottedTeams,
    minimumSquadsPresent: totalSlottedTeams >= minTeamsRequired,
    roomCreated,
    roomCredentialsSet,
    attendanceVerified,
    canStart,
    blockers,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Standard 5 Core Match Operations Pipeline
// ---------------------------------------------------------------------------

/**
 * 1. PREPARE MATCH (SCHEDULED ➔ READY)
 * Prepares match for live staging, verifying schedule readiness and room initialization.
 */
export function prepareMatch(
  match: MatchEntity,
  options?: { operatorUserId?: string; minTeams?: number }
): MatchTransitionResult {
  const validation = validateMatchTransition(match.status, 'READY');
  if (!validation.valid) {
    return {
      success: false,
      previousStatus: match.status,
      currentStatus: match.status,
      match,
      message: validation.reason,
      timestamp: new Date().toISOString(),
    };
  }

  const updatedMatch: MatchEntity = {
    ...match,
    status: 'READY',
  };

  domainEventBus.emit(
    'match.ready',
    'MATCH',
    match.id,
    {
      matchNumber: match.matchNumber,
      title: match.title,
      map: match.map,
      status: 'READY',
    },
    options?.operatorUserId
  );

  return {
    success: true,
    previousStatus: match.status,
    currentStatus: 'READY',
    match: updatedMatch,
    message: `Match #${match.matchNumber} marked READY for lobby check-in.`,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 2. OPEN ROOM (READY ➔ OPEN)
 * Opens custom room credentials to squad captains and marshals.
 */
export function openRoom(
  match: MatchEntity,
  room?: RoomEntity | null,
  options?: { operatorUserId?: string }
): { matchResult: MatchTransitionResult; updatedRoom?: RoomEntity } {
  const validation = validateMatchTransition(match.status, 'OPEN');
  if (!validation.valid) {
    return {
      matchResult: {
        success: false,
        previousStatus: match.status,
        currentStatus: match.status,
        match,
        message: validation.reason,
        timestamp: new Date().toISOString(),
      },
    };
  }

  let updatedRoom = room;
  if (room) {
    const roomTransition = transitionRoomState(room, 'OPEN', options?.operatorUserId);
    if (roomTransition.success && roomTransition.room) {
      updatedRoom = roomTransition.room;
    }
  }

  const updatedMatch: MatchEntity = {
    ...match,
    status: 'OPEN',
    room: updatedRoom,
  };

  domainEventBus.emit(
    'match.room_opened',
    'MATCH',
    match.id,
    {
      matchNumber: match.matchNumber,
      title: match.title,
      roomId: updatedRoom?.roomId,
      status: 'OPEN',
    },
    options?.operatorUserId
  );

  return {
    matchResult: {
      success: true,
      previousStatus: match.status,
      currentStatus: 'OPEN',
      match: updatedMatch,
      message: `In-game room opened for Match #${match.matchNumber}. Credentials available to verified squads.`,
      timestamp: new Date().toISOString(),
    },
    updatedRoom: updatedRoom ?? undefined,
  };
}

/**
 * 3. START MATCH (OPEN ➔ LIVE)
 * Records actualStartTime and sets match status to LIVE.
 */
export function startMatch(
  match: MatchEntity,
  room?: RoomEntity | null,
  options?: { operatorUserId?: string; startTime?: Date | string }
): { matchResult: MatchTransitionResult; updatedRoom?: RoomEntity } {
  const validation = validateMatchTransition(match.status, 'LIVE');
  if (!validation.valid) {
    return {
      matchResult: {
        success: false,
        previousStatus: match.status,
        currentStatus: match.status,
        match,
        message: validation.reason,
        timestamp: new Date().toISOString(),
      },
    };
  }

  const startTime = options?.startTime ? new Date(options.startTime) : new Date();

  let updatedRoom = room;
  if (room && room.status !== 'LIVE') {
    const roomTransition = transitionRoomState(room, 'LIVE', options?.operatorUserId);
    if (roomTransition.success && roomTransition.room) {
      updatedRoom = roomTransition.room;
    }
  }

  const updatedMatch: MatchEntity = {
    ...match,
    status: 'LIVE',
    actualStartTime: startTime,
    room: updatedRoom,
  };

  // Dispatch live events
  domainEventBus.emit(
    'match.starting',
    'MATCH',
    match.id,
    {
      matchNumber: match.matchNumber,
      title: match.title,
      map: match.map,
      roomId: updatedRoom?.roomId,
    },
    options?.operatorUserId
  );

  domainEventBus.emit(
    'match.live',
    'MATCH',
    match.id,
    {
      matchNumber: match.matchNumber,
      actualStartTime: startTime.toISOString(),
      status: 'LIVE',
    },
    options?.operatorUserId
  );

  return {
    matchResult: {
      success: true,
      previousStatus: match.status,
      currentStatus: 'LIVE',
      match: updatedMatch,
      message: `Match #${match.matchNumber} is now LIVE on ${match.map}.`,
      timestamp: startTime.toISOString(),
    },
    updatedRoom: updatedRoom ?? undefined,
  };
}

/**
 * 4. END MATCH (LIVE ➔ COMPLETED)
 * Records actualEndTime and marks match as COMPLETED.
 */
export function endMatch(
  match: MatchEntity,
  room?: RoomEntity | null,
  options?: { operatorUserId?: string; endTime?: Date | string }
): { matchResult: MatchTransitionResult; updatedRoom?: RoomEntity } {
  const validation = validateMatchTransition(match.status, 'COMPLETED');
  if (!validation.valid) {
    return {
      matchResult: {
        success: false,
        previousStatus: match.status,
        currentStatus: match.status,
        match,
        message: validation.reason,
        timestamp: new Date().toISOString(),
      },
    };
  }

  const endTime = options?.endTime ? new Date(options.endTime) : new Date();

  let updatedRoom = room;
  if (room && room.status !== 'COMPLETED') {
    const roomTransition = transitionRoomState(room, 'COMPLETED', options?.operatorUserId);
    if (roomTransition.success && roomTransition.room) {
      updatedRoom = roomTransition.room;
    }
  }

  const updatedMatch: MatchEntity = {
    ...match,
    status: 'COMPLETED',
    actualEndTime: endTime,
    room: updatedRoom,
  };

  domainEventBus.emit(
    'match.ended',
    'MATCH',
    match.id,
    {
      matchNumber: match.matchNumber,
      actualEndTime: endTime.toISOString(),
      status: 'COMPLETED',
    },
    options?.operatorUserId
  );

  return {
    matchResult: {
      success: true,
      previousStatus: match.status,
      currentStatus: 'COMPLETED',
      match: updatedMatch,
      message: `Match #${match.matchNumber} concluded. Ready for score sheet entry.`,
      timestamp: endTime.toISOString(),
    },
    updatedRoom: updatedRoom ?? undefined,
  };
}

/**
 * 5. INITIATE SCORE ENTRY
 * Verifies match completion and initializes the score sheet lifecycle in DRAFT status.
 */
export function initiateScoreEntry(
  match: MatchEntity,
  options?: { operatorUserId?: string }
): { success: boolean; match: MatchEntity; message: string } {
  if (match.status !== 'COMPLETED' && match.status !== 'VERIFIED' && match.status !== 'PUBLISHED') {
    return {
      success: false,
      match,
      message: `Cannot initiate score entry: Match must be in COMPLETED status (current: ${match.status}).`,
    };
  }

  const updatedMatch: MatchEntity = {
    ...match,
    resultStatus: match.resultStatus || 'DRAFT',
  };

  domainEventBus.emit(
    'result.draft_saved',
    'RESULT',
    match.id,
    {
      matchId: match.id,
      matchNumber: match.matchNumber,
      resultStatus: updatedMatch.resultStatus,
    },
    options?.operatorUserId
  );

  return {
    success: true,
    match: updatedMatch,
    message: `Score entry initialized for Match #${match.matchNumber}. Result status: ${updatedMatch.resultStatus}.`,
  };
}

/**
 * CANCEL MATCH
 * Halts match execution and sets status to CANCELLED.
 */
export function cancelMatch(
  match: MatchEntity,
  reason: string,
  operatorUserId?: string
): MatchTransitionResult {
  const updatedMatch: MatchEntity = {
    ...match,
    status: 'CANCELLED',
  };

  domainEventBus.emit(
    'match.cancelled',
    'MATCH',
    match.id,
    {
      matchNumber: match.matchNumber,
      reason,
      status: 'CANCELLED',
    },
    operatorUserId
  );

  return {
    success: true,
    previousStatus: match.status,
    currentStatus: 'CANCELLED',
    match: updatedMatch,
    message: `Match #${match.matchNumber} CANCELLED. Reason: ${reason}`,
    timestamp: new Date().toISOString(),
  };
}
