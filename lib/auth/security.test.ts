import { describe, it, expect } from 'vitest';
import {
  ROLE_PERMISSIONS,
  checkPermission,
  userHasPermission,
  isRoleAtLeast,
  hasAnyPermission,
  hasAllPermissions,
  MOCK_USERS,
  getAllRoles,
} from './roles';
import {
  ROOM_PASSWORD_MASK,
  CAPTAIN_PHONE_MASK,
  CAPTAIN_EMAIL_MASK,
  maskRoom,
  redactRoom,
  maskMatchRoom,
  maskMatchesRooms,
  maskTeamPII,
  redactTeamPII,
  maskTeamsPII,
  sanitizeForRole,
} from './masking';
import {
  assertPermission,
  assertRole,
  assertMatchScoreEditable,
  assertTournamentNotFinalized,
  sanitizeAllowedFields,
  AuthorizationError,
} from './guards';
import {
  createSessionToken,
  parseSessionToken,
  resolveUserSession,
} from './session';
import { computeAuditDelta } from './audit';

describe('RBAC Roles & Permissions Matrix', () => {
  it('SUPER_ADMIN possesses all operational permissions', () => {
    const permissions = ROLE_PERMISSIONS.SUPER_ADMIN;
    for (const [key, value] of Object.entries(permissions)) {
      expect(value, `SUPER_ADMIN should have ${key}`).toBe(true);
    }
  });

  it('TOURNAMENT_ADMIN has high administrative privileges including audit and finalization', () => {
    expect(checkPermission('TOURNAMENT_ADMIN', 'canManageTournaments')).toBe(true);
    expect(checkPermission('TOURNAMENT_ADMIN', 'canVerifyScores')).toBe(true);
    expect(checkPermission('TOURNAMENT_ADMIN', 'canPublishScores')).toBe(true);
    expect(checkPermission('TOURNAMENT_ADMIN', 'canOverridePublishedScores')).toBe(true);
    expect(checkPermission('TOURNAMENT_ADMIN', 'canIssuePenalties')).toBe(true);
    expect(checkPermission('TOURNAMENT_ADMIN', 'canFinalizeTournament')).toBe(true);
    expect(checkPermission('TOURNAMENT_ADMIN', 'canViewAuditLogs')).toBe(true);
    expect(checkPermission('TOURNAMENT_ADMIN', 'canSeeRoomPasswords')).toBe(true);
  });

  it('MATCH_ADMIN can manage rooms and see credentials, but CANNOT verify scores or finalize', () => {
    expect(checkPermission('MATCH_ADMIN', 'canManageRooms')).toBe(true);
    expect(checkPermission('MATCH_ADMIN', 'canSeeRoomPasswords')).toBe(true);
    expect(checkPermission('MATCH_ADMIN', 'canChangeMatchState')).toBe(true);
    expect(checkPermission('MATCH_ADMIN', 'canManageAttendance')).toBe(true);
    expect(checkPermission('MATCH_ADMIN', 'canEditScores')).toBe(true);

    // Forbidden actions for Match Admin
    expect(checkPermission('MATCH_ADMIN', 'canManageTournaments')).toBe(false);
    expect(checkPermission('MATCH_ADMIN', 'canVerifyScores')).toBe(false);
    expect(checkPermission('MATCH_ADMIN', 'canPublishScores')).toBe(false);
    expect(checkPermission('MATCH_ADMIN', 'canIssuePenalties')).toBe(false);
    expect(checkPermission('MATCH_ADMIN', 'canFinalizeTournament')).toBe(false);
    expect(checkPermission('MATCH_ADMIN', 'canViewAuditLogs')).toBe(false);
  });

  it('SCOREKEEPER can enter draft scores, but CANNOT see room passwords or verify scores', () => {
    expect(checkPermission('SCOREKEEPER', 'canEditScores')).toBe(true);
    expect(checkPermission('SCOREKEEPER', 'canViewPublicLeaderboard')).toBe(true);

    // Forbidden actions for Scorekeeper
    expect(checkPermission('SCOREKEEPER', 'canSeeRoomPasswords')).toBe(false);
    expect(checkPermission('SCOREKEEPER', 'canManageRooms')).toBe(false);
    expect(checkPermission('SCOREKEEPER', 'canVerifyScores')).toBe(false);
    expect(checkPermission('SCOREKEEPER', 'canPublishScores')).toBe(false);
    expect(checkPermission('SCOREKEEPER', 'canIssuePenalties')).toBe(false);
    expect(checkPermission('SCOREKEEPER', 'canFinalizeTournament')).toBe(false);
    expect(checkPermission('SCOREKEEPER', 'canViewAuditLogs')).toBe(false);
    expect(checkPermission('SCOREKEEPER', 'canViewPlayerPII')).toBe(false);
  });

  it('OBSERVER / PUBLIC has read-only access and cannot view secrets', () => {
    expect(checkPermission('OBSERVER', 'canViewPublicLeaderboard')).toBe(true);

    expect(checkPermission('OBSERVER', 'canSeeRoomPasswords')).toBe(false);
    expect(checkPermission('OBSERVER', 'canEditScores')).toBe(false);
    expect(checkPermission('OBSERVER', 'canManageTeams')).toBe(false);
    expect(checkPermission('OBSERVER', 'canManageRooms')).toBe(false);
    expect(checkPermission('OBSERVER', 'canViewPlayerPII')).toBe(false);
  });

  it('Role hierarchy correctly orders authorization levels', () => {
    expect(isRoleAtLeast('SUPER_ADMIN', 'TOURNAMENT_ADMIN')).toBe(true);
    expect(isRoleAtLeast('TOURNAMENT_ADMIN', 'MATCH_ADMIN')).toBe(true);
    expect(isRoleAtLeast('MATCH_ADMIN', 'SCOREKEEPER')).toBe(true);
    expect(isRoleAtLeast('SCOREKEEPER', 'OBSERVER')).toBe(true);

    expect(isRoleAtLeast('OBSERVER', 'MATCH_ADMIN')).toBe(false);
    expect(isRoleAtLeast('SCOREKEEPER', 'TOURNAMENT_ADMIN')).toBe(false);
    expect(isRoleAtLeast('MATCH_ADMIN', 'SUPER_ADMIN')).toBe(false);
  });

  it('userHasPermission and helper predicates evaluate correctly', () => {
    const adminSession = MOCK_USERS.TOURNAMENT_ADMIN;
    const scorekeeperSession = MOCK_USERS.SCOREKEEPER;

    expect(userHasPermission(adminSession, 'canVerifyScores')).toBe(true);
    expect(userHasPermission(scorekeeperSession, 'canVerifyScores')).toBe(false);
    expect(userHasPermission(null, 'canEditScores')).toBe(false);

    expect(hasAnyPermission('SCOREKEEPER', ['canManageRooms', 'canEditScores'])).toBe(true);
    expect(hasAllPermissions('SCOREKEEPER', ['canManageRooms', 'canEditScores'])).toBe(false);
  });
});

describe('Sensitive Credential & PII Masking', () => {
  const sampleRoom = {
    id: 'room_1',
    matchId: 'm1',
    roomName: 'ROOM-1',
    roomId: '1234567',
    password: 'superSecretLobbyPassword123',
    status: 'READY',
  };

  const sampleTeam = {
    id: 'team_soul',
    name: 'Team SouL',
    tag: 'SOUL',
    captainName: 'Mortal',
    captainPhone: '+919876543210',
    captainEmail: 'mortal@teamsoul.in',
  };

  it('maskRoom conceals password for unauthorized requesters', () => {
    const masked = maskRoom(sampleRoom, false);
    expect(masked.password).toBe(ROOM_PASSWORD_MASK);
    expect(masked.roomId).toBe('1234567'); // Room ID remains visible for joining
  });

  it('maskRoom preserves password for authorized staff', () => {
    const unmasked = maskRoom(sampleRoom, true);
    expect(unmasked.password).toBe('superSecretLobbyPassword123');
  });

  it('redactRoom completely deletes password property', () => {
    const redacted = redactRoom(sampleRoom);
    expect('password' in redacted).toBe(false);
    expect(redacted.roomId).toBe('1234567');
  });

  it('maskMatchRoom and maskMatchesRooms correctly mask nested room passwords', () => {
    const match = {
      id: 'm1',
      title: 'Match 1 - Group A',
      room: sampleRoom,
    };

    const maskedMatch = maskMatchRoom(match, false);
    expect(maskedMatch.room?.password).toBe(ROOM_PASSWORD_MASK);

    const matchesList = maskMatchesRooms([match, match], false);
    expect(matchesList[0].room?.password).toBe(ROOM_PASSWORD_MASK);
    expect(matchesList[1].room?.password).toBe(ROOM_PASSWORD_MASK);
  });

  it('maskTeamPII conceals captain phone and email for unauthorized viewers', () => {
    const masked = maskTeamPII(sampleTeam, false);
    expect(masked.captainPhone).toBe(CAPTAIN_PHONE_MASK);
    expect(masked.captainEmail).toBe(CAPTAIN_EMAIL_MASK);
    expect(masked.captainName).toBe('Mortal'); // Captain public name preserved
  });

  it('maskTeamPII preserves PII when canSeePII is true', () => {
    const unmasked = maskTeamPII(sampleTeam, true);
    expect(unmasked.captainPhone).toBe('+919876543210');
    expect(unmasked.captainEmail).toBe('mortal@teamsoul.in');
  });

  it('redactTeamPII completely removes contact fields', () => {
    const redacted = redactTeamPII(sampleTeam);
    expect('captainPhone' in redacted).toBe(false);
    expect('captainEmail' in redacted).toBe(false);
  });

  it('sanitizeForRole selectively masks based on caller role', () => {
    // Observer: both room password and team PII masked
    const sanitizedObserver = sanitizeForRole({ room: sampleRoom, team: sampleTeam }, 'OBSERVER');
    expect(sanitizedObserver.room.password).toBe(ROOM_PASSWORD_MASK);

    // Match Admin: room password and PII visible
    const sanitizedMatchAdmin = sanitizeForRole({ room: sampleRoom, team: sampleTeam }, 'MATCH_ADMIN');
    expect(sanitizedMatchAdmin.room.password).toBe('superSecretLobbyPassword123');

    // Scorekeeper: room password masked
    const sanitizedScorekeeper = sanitizeForRole(sampleRoom, 'SCOREKEEPER');
    expect(sanitizedScorekeeper.password).toBe(ROOM_PASSWORD_MASK);
  });
});

describe('Authorization Guards & Immutability', () => {
  it('assertPermission succeeds when permission is held', () => {
    expect(() => {
      assertPermission(MOCK_USERS.SUPER_ADMIN, 'canManageTournaments');
    }).not.toThrow();
  });

  it('assertPermission throws 401 when session is null', () => {
    expect(() => {
      assertPermission(null, 'canEditScores');
    }).toThrow(AuthorizationError);

    try {
      assertPermission(null, 'canEditScores');
    } catch (err: any) {
      expect(err.statusCode).toBe(401);
      expect(err.code).toBe('UNAUTHORIZED');
    }
  });

  it('assertPermission throws 403 when role lacks required permission', () => {
    try {
      assertPermission(MOCK_USERS.SCOREKEEPER, 'canVerifyScores');
      expect.fail('Should have thrown AuthorizationError');
    } catch (err: any) {
      expect(err.statusCode).toBe(403);
      expect(err.code).toBe('FORBIDDEN');
    }
  });

  it('assertRole enforces required operational roles', () => {
    expect(() => {
      assertRole(MOCK_USERS.TOURNAMENT_ADMIN, ['SUPER_ADMIN', 'TOURNAMENT_ADMIN']);
    }).not.toThrow();

    expect(() => {
      assertRole(MOCK_USERS.OBSERVER, ['SUPER_ADMIN', 'TOURNAMENT_ADMIN']);
    }).toThrow(AuthorizationError);
  });

  it('assertMatchScoreEditable allows edits on DRAFT or SUBMITTED matches', () => {
    expect(() => {
      assertMatchScoreEditable({ resultStatus: 'DRAFT' }, MOCK_USERS.SCOREKEEPER);
    }).not.toThrow();

    expect(() => {
      assertMatchScoreEditable({ resultStatus: 'SUBMITTED' }, MOCK_USERS.SCOREKEEPER);
    }).not.toThrow();
  });

  it('assertMatchScoreEditable blocks edits on PUBLISHED results with 409 PUBLISHED_LOCKED', () => {
    try {
      assertMatchScoreEditable(
        { resultStatus: 'PUBLISHED' },
        MOCK_USERS.SCOREKEEPER,
        { isOverride: false }
      );
      expect.fail('Should have rejected direct edit on published match');
    } catch (err: any) {
      expect(err.statusCode).toBe(409);
      expect(err.code).toBe('PUBLISHED_LOCKED');
    }
  });

  it('assertMatchScoreEditable permits authorized override with mandatory audit reason', () => {
    // Valid override by Tournament Admin
    expect(() => {
      assertMatchScoreEditable(
        { resultStatus: 'PUBLISHED' },
        MOCK_USERS.TOURNAMENT_ADMIN,
        {
          isOverride: true,
          overrideReason: 'Official protest accepted regarding Team GodL disconnect in game 3',
        }
      );
    }).not.toThrow();

    // Rejects if override reason is empty
    expect(() => {
      assertMatchScoreEditable(
        { resultStatus: 'PUBLISHED' },
        MOCK_USERS.TOURNAMENT_ADMIN,
        { isOverride: true, overrideReason: '  ' }
      );
    }).toThrow(AuthorizationError);

    // Rejects if role lacks override permission (e.g. Scorekeeper)
    expect(() => {
      assertMatchScoreEditable(
        { resultStatus: 'PUBLISHED' },
        MOCK_USERS.SCOREKEEPER,
        { isOverride: true, overrideReason: 'Tried to change score' }
      );
    }).toThrow(AuthorizationError);
  });

  it('assertTournamentNotFinalized rejects mutations on finalized tournaments', () => {
    expect(() => {
      assertTournamentNotFinalized({ isFinalized: false, status: 'LIVE' });
    }).not.toThrow();

    expect(() => {
      assertTournamentNotFinalized({ isFinalized: true, status: 'COMPLETED' });
    }).toThrow(AuthorizationError);
  });

  it('sanitizeAllowedFields prevents mass-assignment attacks', () => {
    const untrustedPayload = {
      name: 'Alpha Squad',
      tag: 'ALP',
      isVerified: true, // Injected attempt to self-verify
      status: 'ADMIN_OVERRIDE', // Injected
      role: 'SUPER_ADMIN', // Injected
    };

    const allowed = sanitizeAllowedFields(untrustedPayload, ['name', 'tag'] as const);
    expect(allowed).toEqual({ name: 'Alpha Squad', tag: 'ALP' });
    expect('isVerified' in allowed).toBe(false);
    expect('role' in allowed).toBe(false);
  });
});

describe('Session Token & Request Resolution', () => {
  it('encodes and parses session tokens accurately', () => {
    const session = MOCK_USERS.MATCH_ADMIN;
    const token = createSessionToken(session);
    const parsed = parseSessionToken(token);

    expect(parsed?.id).toBe(session.id);
    expect(parsed?.role).toBe('MATCH_ADMIN');
    expect(parsed?.email).toBe(session.email);
  });

  it('resolveUserSession detects headers correctly', async () => {
    const req = new Request('http://localhost:3000/api/matches', {
      headers: {
        'x-user-role': 'SCOREKEEPER',
        'x-user-id': 'usr_tester_123',
      },
    });

    const session = await resolveUserSession(req);
    expect(session?.role).toBe('SCOREKEEPER');
    expect(session?.id).toBe('usr_tester_123');
  });

  it('resolveUserSession resolves shorthand bearer tokens', async () => {
    const req = new Request('http://localhost:3000/api/matches', {
      headers: {
        authorization: 'Bearer dev-tournamentadmin',
      },
    });

    const session = await resolveUserSession(req);
    expect(session?.role).toBe('TOURNAMENT_ADMIN');
  });
});

describe('Audit Delta Computation', () => {
  it('computes field-level deltas between before and after states', () => {
    const before = { kills: 10, placement: 2, totalPoints: 16 };
    const after = { kills: 12, placement: 1, totalPoints: 22 };

    const delta = computeAuditDelta(before, after);
    expect(delta.changedKeys.sort()).toEqual(['kills', 'placement', 'totalPoints'].sort());
    expect(delta.deltas.kills).toEqual({ before: 10, after: 12 });
    expect(delta.deltas.placement).toEqual({ before: 2, after: 1 });
  });

  it('parses JSON string inputs seamlessly', () => {
    const before = JSON.stringify({ status: 'DRAFT' });
    const after = JSON.stringify({ status: 'PUBLISHED' });

    const delta = computeAuditDelta(before, after);
    expect(delta.changedKeys).toEqual(['status']);
    expect(delta.deltas.status).toEqual({ before: 'DRAFT', after: 'PUBLISHED' });
  });
});
