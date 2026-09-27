/**
 * BGMI Tournament Control Center (TCC) — Session Management & Resolution
 * Resolves authenticated UserSession from HTTP headers, bearer tokens, cookies, or dev fallbacks.
 */

import { Role, UserSession } from './types';
import { DEFAULT_DEV_USER, MOCK_USERS, isValidRole } from './roles';

/**
 * Encode a UserSession into a lightweight bearer token.
 */
export function createSessionToken(session: UserSession): string {
  const json = JSON.stringify(session);
  return Buffer.from(json, 'utf8').toString('base64');
}

/**
 * Decode and validate a UserSession token.
 */
export function parseSessionToken(token: string): UserSession | null {
  try {
    const raw = Buffer.from(token, 'base64').toString('utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.id === 'string' && isValidRole(parsed.role)) {
      return {
        id: parsed.id,
        name: parsed.name || 'Staff User',
        email: parsed.email || `${parsed.id}@bgmi-tcc.esports`,
        role: parsed.role,
      };
    }
  } catch {
    // Malformed token
  }
  return null;
}

/**
 * Retrieve dev mock session for a specific role.
 */
export function getDevSessionForRole(role: Role): UserSession {
  return MOCK_USERS[role] || DEFAULT_DEV_USER;
}

/**
 * Resolve UserSession from a Next.js / standard Web Request.
 */
export async function resolveUserSession(req?: Request): Promise<UserSession | null> {
  if (!req) {
    return process.env.NODE_ENV !== 'production' ? DEFAULT_DEV_USER : null;
  }

  // 1. Direct explicit headers (useful for internal proxies and test runners)
  const roleHeader = req.headers.get('x-user-role');
  if (roleHeader && isValidRole(roleHeader.toUpperCase())) {
    const role = roleHeader.toUpperCase() as Role;
    return {
      id: req.headers.get('x-user-id') || `usr_${role.toLowerCase()}`,
      name: req.headers.get('x-user-name') || MOCK_USERS[role]?.name || 'Staff User',
      email: req.headers.get('x-user-email') || MOCK_USERS[role]?.email || `${role.toLowerCase()}@bgmi-tcc.esports`,
      role,
    };
  }

  // 2. Authorization header (Bearer token)
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();

    // Check shorthand dev tokens
    const devTokenMap: Record<string, Role> = {
      'dev-superadmin': 'SUPER_ADMIN',
      'dev-tournamentadmin': 'TOURNAMENT_ADMIN',
      'dev-matchadmin': 'MATCH_ADMIN',
      'dev-scorekeeper': 'SCOREKEEPER',
      'dev-observer': 'OBSERVER',
    };

    if (token in devTokenMap) {
      return MOCK_USERS[devTokenMap[token]];
    }

    // Attempt base64 token parsing
    const parsedSession = parseSessionToken(token);
    if (parsedSession) {
      return parsedSession;
    }
  }

  // 3. Cookie based resolution
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [k, ...v] = c.trim().split('=');
        return [k, decodeURIComponent(v.join('='))];
      })
    );

    if (cookies.bgmi_session_role && isValidRole(cookies.bgmi_session_role)) {
      const role = cookies.bgmi_session_role as Role;
      return MOCK_USERS[role] || {
        id: cookies.bgmi_session_uid || `usr_${role.toLowerCase()}`,
        name: cookies.bgmi_session_name || 'Staff User',
        email: cookies.bgmi_session_email || `${role.toLowerCase()}@bgmi-tcc.esports`,
        role,
      };
    }

    if (cookies.bgmi_tcc_session) {
      const parsedSession = parseSessionToken(cookies.bgmi_tcc_session);
      if (parsedSession) return parsedSession;
    }
  }

  // 4. Development & Demo fallback
  // In development, testing, or when DEMO_AUTH is true, default to SUPER_ADMIN
  const isDevOrDemo =
    process.env.NODE_ENV !== 'production' ||
    process.env.ENABLE_DEMO_AUTH === 'true';

  if (isDevOrDemo) {
    return DEFAULT_DEV_USER;
  }

  return null;
}
