/**
 * BGMI Tournament Control Center (TCC) — Authorization Guards & Immutability Checks
 * Server-side assertions, IDOR guards, and published result protection.
 */

import { NextResponse } from 'next/server';
import { Role, UserSession, PermissionKey } from './types';
import { checkPermission } from './roles';
import { resolveUserSession } from './session';

export class AuthorizationError extends Error {
  public statusCode: number;
  public code: string;

  constructor(
    message: string,
    statusCode = 403,
    code = 'FORBIDDEN'
  ) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Assert that a user session exists and possesses the required permission.
 */
export function assertPermission(
  session: UserSession | null | undefined,
  permission: PermissionKey
): asserts session is UserSession {
  if (!session) {
    throw new AuthorizationError(
      'Authentication required to perform this action',
      401,
      'UNAUTHORIZED'
    );
  }

  if (!checkPermission(session.role, permission)) {
    throw new AuthorizationError(
      `Forbidden: Role '${session.role}' lacks permission '${permission}'`,
      403,
      'FORBIDDEN'
    );
  }
}

/**
 * Assert that a user session possesses one of the allowed roles.
 */
export function assertRole(
  session: UserSession | null | undefined,
  allowedRoles: Role | Role[]
): asserts session is UserSession {
  if (!session) {
    throw new AuthorizationError(
      'Authentication required to perform this action',
      401,
      'UNAUTHORIZED'
    );
  }

  const roleList = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  if (!roleList.includes(session.role)) {
    throw new AuthorizationError(
      `Forbidden: Role '${session.role}' is not authorized. Required: ${roleList.join(', ')}`,
      403,
      'FORBIDDEN'
    );
  }
}

/**
 * Assert that a match's scores can be edited.
 * Enforces published score immutability: once PUBLISHED, direct editing is rejected with 409
 * unless explicitly flagged with isOverride and accompanied by a mandatory reason.
 */
export function assertMatchScoreEditable(
  match: { resultStatus?: string | null; status?: string | null },
  session?: UserSession | null,
  options?: { isOverride?: boolean; overrideReason?: string }
): void {
  const isPublished =
    match.resultStatus === 'PUBLISHED' || match.status === 'PUBLISHED';

  if (!isPublished) {
    return; // DRAFT, SUBMITTED, or VERIFIED results can be updated by authorized staff
  }

  // Result is PUBLISHED: verify explicit override
  if (!options?.isOverride) {
    throw new AuthorizationError(
      'Match results are PUBLISHED and locked against direct edits. Administrative override required.',
      409,
      'PUBLISHED_LOCKED'
    );
  }

  if (session) {
    assertPermission(session, 'canOverridePublishedScores');
  }

  if (!options.overrideReason || !options.overrideReason.trim()) {
    throw new AuthorizationError(
      'An explicit audit override reason is required to modify published match scores.',
      400,
      'OVERRIDE_REASON_REQUIRED'
    );
  }
}

/**
 * Assert that a tournament is not finalized.
 * Once finalized, all bracket, team, and score mutations are permanently locked.
 */
export function assertTournamentNotFinalized(tournament: {
  isFinalized?: boolean | null;
  status?: string | null;
}): void {
  if (tournament.isFinalized || tournament.status === 'COMPLETED' || tournament.status === 'ARCHIVED') {
    throw new AuthorizationError(
      'Tournament is finalized and locked. No further modifications are permitted.',
      409,
      'TOURNAMENT_FINALIZED_LOCKED'
    );
  }
}

/**
 * Anti-Mass Assignment Utility:
 * Extracts only white-listed keys from an untrusted client payload.
 */
export function sanitizeAllowedFields<T extends Record<string, any>>(
  input: unknown,
  allowedKeys: readonly (keyof T)[]
): Partial<T> {
  if (!input || typeof input !== 'object') {
    return {};
  }

  const record = input as Record<string, any>;
  const sanitized: Partial<T> = {};

  for (const key of allowedKeys) {
    if (key in record && record[key as string] !== undefined) {
      sanitized[key] = record[key as string];
    }
  }

  return sanitized;
}

/**
 * Authorize an incoming HTTP request in Next.js Route Handlers.
 * Returns either an active UserSession or a ready-to-return NextResponse error.
 */
export async function authorizeRequest(
  req: Request,
  options: {
    requiredPermission?: PermissionKey;
    requiredRole?: Role | Role[];
    allowPublic?: boolean;
  } = {}
): Promise<
  | { session: UserSession; errorResponse: null }
  | { session: null; errorResponse: NextResponse }
> {
  const session = await resolveUserSession(req);

  // If public access is allowed and no session exists
  if (!session && options.allowPublic) {
    return { session: null as any, errorResponse: null };
  }

  // Authentication check
  if (!session) {
    return {
      session: null,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required to access this resource',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 }
      ),
    };
  }

  // Permission check
  if (options.requiredPermission) {
    if (!checkPermission(session.role, options.requiredPermission)) {
      return {
        session: null,
        errorResponse: NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: `Insufficient permissions. Required: ${options.requiredPermission}`,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 403 }
        ),
      };
    }
  }

  // Role check
  if (options.requiredRole) {
    const allowed = Array.isArray(options.requiredRole)
      ? options.requiredRole
      : [options.requiredRole];
    if (!allowed.includes(session.role)) {
      return {
        session: null,
        errorResponse: NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: `Forbidden for role '${session.role}'. Required: ${allowed.join(', ')}`,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 403 }
        ),
      };
    }
  }

  return { session, errorResponse: null };
}
