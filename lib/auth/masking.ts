/**
 * BGMI Tournament Control Center (TCC) — Sensitive Credential & PII Masking
 * Utilities for masking lobby passwords and sensitive player contact details.
 */

import { Role, UserSession } from './types';
import { checkPermission } from './roles';

export const ROOM_PASSWORD_MASK = '••••••••';
export const CAPTAIN_PHONE_MASK = '••••••••••';
export const CAPTAIN_EMAIL_MASK = '••••••@••••.•••';

export interface RoomLike {
  id?: string;
  matchId?: string;
  roomName?: string;
  roomId?: string | null;
  password?: string | null;
  status?: string;
  [key: string]: any;
}

export interface MatchWithRoomLike {
  id?: string;
  room?: RoomLike | null;
  [key: string]: any;
}

export interface TeamWithPIILike {
  id?: string;
  name?: string;
  tag?: string;
  captainName?: string | null;
  captainPhone?: string | null;
  captainEmail?: string | null;
  [key: string]: any;
}

/**
 * Mask room password in a Room object unless canSeePassword is true.
 */
export function maskRoom<T extends RoomLike | null | undefined>(
  room: T,
  canSeePassword = false
): T {
  if (!room) return room;
  if (canSeePassword) return room;

  return {
    ...room,
    password: room.password ? ROOM_PASSWORD_MASK : room.password,
  };
}

/**
 * Completely strip password field from a Room object.
 */
export function redactRoom<T extends RoomLike>(room: T): Omit<T, 'password'> {
  const { password, ...rest } = room;
  return rest as Omit<T, 'password'>;
}

/**
 * Mask room password in a Match object containing a nested room.
 */
export function maskMatchRoom<T extends MatchWithRoomLike>(
  match: T,
  canSeePassword = false
): T {
  if (!match || !match.room) return match;
  return {
    ...match,
    room: maskRoom(match.room, canSeePassword),
  };
}

/**
 * Mask room passwords across an array of match objects.
 */
export function maskMatchesRooms<T extends MatchWithRoomLike>(
  matches: T[],
  canSeePassword = false
): T[] {
  if (!Array.isArray(matches)) return matches;
  return matches.map((match) => maskMatchRoom(match, canSeePassword));
}

/**
 * Mask captain PII (phone and email) on a Team object unless canSeePII is true.
 */
export function maskTeamPII<T extends TeamWithPIILike | null | undefined>(
  team: T,
  canSeePII = false
): T {
  if (!team) return team;
  if (canSeePII) return team;

  return {
    ...team,
    captainPhone: team.captainPhone ? CAPTAIN_PHONE_MASK : team.captainPhone,
    captainEmail: team.captainEmail ? CAPTAIN_EMAIL_MASK : team.captainEmail,
  };
}

/**
 * Completely redact captain PII fields from a Team object.
 */
export function redactTeamPII<T extends TeamWithPIILike>(
  team: T
): Omit<T, 'captainPhone' | 'captainEmail'> {
  const { captainPhone, captainEmail, ...rest } = team;
  return rest as Omit<T, 'captainPhone' | 'captainEmail'>;
}

/**
 * Mask captain PII across an array of teams.
 */
export function maskTeamsPII<T extends TeamWithPIILike>(
  teams: T[],
  canSeePII = false
): T[] {
  if (!Array.isArray(teams)) return teams;
  return teams.map((team) => maskTeamPII(team, canSeePII));
}

/**
 * Automatically sanitize arbitrary data payloads according to the caller's operational Role.
 */
export function sanitizeForRole<T>(data: T, role: Role): T {
  const canSeePassword = checkPermission(role, 'canSeeRoomPasswords');
  const canSeePII = checkPermission(role, 'canViewPlayerPII');

  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForRole(item, role)) as unknown as T;
  }

  const result: any = { ...data };

  // Room masking
  if ('password' in result && typeof result.password !== 'undefined') {
    if (!canSeePassword && result.password) {
      result.password = ROOM_PASSWORD_MASK;
    }
  }

  // Nested room masking (Match.room)
  if (result.room && typeof result.room === 'object') {
    result.room = maskRoom(result.room, canSeePassword);
  }

  // Team captain PII masking
  if ('captainPhone' in result || 'captainEmail' in result) {
    if (!canSeePII) {
      if (result.captainPhone) result.captainPhone = CAPTAIN_PHONE_MASK;
      if (result.captainEmail) result.captainEmail = CAPTAIN_EMAIL_MASK;
    }
  }

  return result as T;
}

/**
 * Convenience helper to sanitize data for a UserSession (or unauthenticated visitor).
 */
export function sanitizeForSession<T>(data: T, session: UserSession | null | undefined): T {
  const role: Role = session?.role || 'OBSERVER';
  return sanitizeForRole(data, role);
}
