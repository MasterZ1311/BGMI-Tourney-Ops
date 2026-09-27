# BGMI Tournament Control Center (TCC) — Security Architecture & Threat Model

## 1. Executive Summary & Security Philosophy

The **BGMI Tournament Control Center (BGMI TCC)** is an operations-critical tournament platform engineered for high-stakes Battlegrounds Mobile India esports competitions. Because BGMI lobbies feature up to 25 squads simultaneously competing for major cash prizes and qualifying seeds, the platform adheres to four foundational security principles:

1. **Zero Credential Exposure**: Custom match Room IDs and Room Passwords must never leak to unverified squads, public observers, or streaming production overlays.
2. **Authoritative Server Enforcement**: Every state mutation is validated server-side; client UI gates are strictly cosmetic.
3. **Immutable Published Results**: Once match scores transition to `PUBLISHED`, direct mutations are blocked. Any adjustments require an explicit administrative override accompanied by mandatory rationale and recorded in an append-only audit ledger.
4. **Defense in Depth**: Layered protections across edge HTTP middleware, route authorization guards, Zod schema validation, Prisma parameterization, and output masking filters.

---

## 2. Threat Model & Mitigation Matrix

| Threat Category | Attack Vector & Impact | Platform Mitigation Strategy |
|---|---|---|
| **Lobby Credential Leakage** | Unauthorized players intercepting Room ID & Password to join and grief an official lobby. | Room credentials are never emitted to unauthenticated users or public `/display` endpoints. Passwords are automatically masked (`••••••••`) via `@/lib/auth/masking` unless the caller possesses `canSeeRoomPasswords`. |
| **Score Tampering & Collusion** | Rogue scorekeeper or unauthorized admin altering placement or kill points to manipulate prize placements. | Strict 4-tier lifecycle (`DRAFT` ➔ `SUBMITTED` ➔ `VERIFIED` ➔ `PUBLISHED`). Scorekeepers can only submit `DRAFT` / `SUBMITTED` results. Direct edits on `PUBLISHED` matches trigger HTTP `409 Conflict` (`PUBLISHED_LOCKED`) unless an explicit override with mandatory audit reason is filed by a Tournament Admin or Super Admin. |
| **Player PII Data Exposure** | Scraping team captain phone numbers and email addresses for harassment or doxxing. | Captain contact details are classified as confidential PII and masked (`••••••••••`, `••••••@••••.•••`) on all observer and public team listings via `maskTeamPII()`. |
| **Mass Assignment Injection** | Malicious requests submitting extra fields (e.g. inject `isVerified: true`, `role: "SUPER_ADMIN"`). | Enforced `sanitizeAllowedFields()` and Zod payload parsers that strip any unlisted keys from request bodies. |
| **IDOR (Insecure Direct Object Reference)** | Modifying match results or penalties belonging to another tournament by manipulating URL IDs. | Relational integrity checks verify that matches, teams, and penalties belong to the target tournament context before executing mutations. |
| **Unauthorized State Skipping** | Prematurely finalizing a tournament with unverified matches or active protests. | Pre-flight finalization auditor (`auditTournamentFinalization`) programmatically blocks finalization unless 100% of matches are completed and verified with zero unresolved disputes. Finalized tournaments are permanently locked against mutations (`assertTournamentNotFinalized`). |
| **XSS & Content Injection** | Injecting scripts via squad tags, player IGNs, or dispute descriptions. | React automatic string escaping, strict Content Security Policy (CSP) enforced in Next.js middleware, and strict input format validation. |
| **Clickjacking & Framing Attacks** | Malicious websites framing admin portals to hijack user clicks. | Next.js Edge Middleware sets `X-Frame-Options: SAMEORIGIN` across administrative paths, while explicitly permitting `/display` for OBS Studio broadcast overlays. |

---

## 3. Role-Based Access Control (RBAC) Matrix

The platform enforces five strictly delineated operational roles:

1. **`SUPER_ADMIN`**: Full platform authority across all tournaments, system settings, user permissions, and audit logs.
2. **`TOURNAMENT_ADMIN`**: Head tournament director. Manages tournament configuration, scoring rules, group locking, score verification, score publication, dispute adjudication, penalties, and tournament finalization.
3. **`MATCH_ADMIN`**: Match day lobby marshal. Coordinates squad check-in, distributes room credentials, updates match status (`START`, `LIVE`, `END`). Cannot verify scores, issue penalties, or finalize tournaments.
4. **`SCOREKEEPER`**: Data entry operator. Performs rapid score entry and submits draft scores. Cannot view room passwords, verify scores, or issue penalties.
5. **`OBSERVER`**: Broadcast team, casters, and public viewers. Read-only access to schedules, public leaderboards, and stream overlays. All room passwords and captain contact details are masked.

### Detailed Role Permissions Table

| Action / Permission Key | SUPER_ADMIN | TOURNAMENT_ADMIN | MATCH_ADMIN | SCOREKEEPER | OBSERVER | PUBLIC |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `canManageTournaments` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `canManageTeams` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `canManageGroups` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `canManageMatches` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `canManageRooms` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `canSeeRoomPasswords` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `canChangeMatchState` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `canManageAttendance` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `canEditScores` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `canVerifyScores` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `canPublishScores` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `canOverridePublishedScores` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `canIssuePenalties` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `canVoidPenalties` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `canCreateDisputes` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `canAdjudicateDisputes` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `canFinalizeTournament` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `canViewAuditLogs` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `canViewPlayerPII` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `canViewPublicLeaderboard` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 4. Credential & PII Masking Standards

All room credentials and sensitive contact details must pass through `@/lib/auth/masking` before returning to the caller or rendering in public UI views:

```typescript
import { maskRoom, maskTeamPII, sanitizeForRole } from '@/lib/auth';

// Masking a room entity for non-credentialed roles
const publicRoom = maskRoom(room, canSeePassword); // password => "••••••••"

// Masking captain contact details
const publicTeam = maskTeamPII(team, canSeePII); // captainPhone => "••••••••••"

// Automatic recursive payload sanitization based on caller's role
const sanitizedResponse = sanitizeForRole(payload, session.role);
```

### Masking Constants
- **Lobby Password Mask**: `'••••••••'`
- **Captain Phone Mask**: `'••••••••••'`
- **Captain Email Mask**: `'••••••@••••.•••'`

---

## 5. Result Immutability & Anti-Tampering Mechanism

To protect competitive integrity:

1. **4-Tier Result State Machine**:
   - `DRAFT`: Raw scores entered by scorekeepers; editable freely.
   - `SUBMITTED`: Scores finalized by scorekeepers for review.
   - `VERIFIED`: Roster and kill validation confirmed by Tournament Admin.
   - `PUBLISHED`: Scores officially broadcast to leaderboard and stream overlays.

2. **Published Result Lock**:
   - Direct edits to a `PUBLISHED` match result are rejected by `assertMatchScoreEditable` with HTTP `409 Conflict` (`PUBLISHED_LOCKED`).
   - If an official protest or mathematical discrepancy requires correction, an administrative override must be performed by a `TOURNAMENT_ADMIN` or `SUPER_ADMIN` with:
     - `isOverride: true`
     - `overrideReason: "..."` (mandatory non-empty audit rationale)
   - The override emits a `MATCH_SCORE_OVERRIDDEN` event in `AuditLog` containing before and after score snapshots.

3. **Tournament Finalization Lock**:
   - Once a tournament is finalized (`isFinalized === true`), all mutating endpoints reject updates with `409 Conflict` (`TOURNAMENT_FINALIZED_LOCKED`).

---

## 6. Audit Logging Architecture

State transitions that alter tournament outcomes are committed to the `AuditLog` relational table.

### Audit Log Schema
```prisma
model AuditLog {
  id           String      @id @default(cuid())
  tournamentId String?
  userId       String?
  action       String
  entityType   String
  entityId     String
  beforeState  String?     // JSON snapshot of pre-mutation state
  afterState   String?     // JSON snapshot of post-mutation state
  reason       String?     // Administrative justification
  createdAt    DateTime    @default(now())

  @@index([tournamentId])
  @@index([entityType, entityId])
}
```

### Action Taxonomy
- `MATCH_SCORE_SAVED`: Scorekeeper submitted score update.
- `MATCH_SCORE_VERIFIED`: Head admin verified match scores.
- `MATCH_SCORE_PUBLISHED`: Scores released to leaderboard.
- `MATCH_SCORE_OVERRIDDEN`: Post-publication administrative score correction.
- `PENALTY_ISSUED`: Penalty points deducted from a team.
- `PENALTY_VOIDED`: Previously issued penalty nullified.
- `DISPUTE_ADJUDICATED`: Official dispute accepted or rejected.
- `GROUP_LOCKED`: Group allocation locked against roster swaps.
- `TOURNAMENT_FINALIZED`: Tournament outcome sealed.
- `ROOM_CREDENTIALS_UPDATED`: In-game room credentials modified.

### Transactional Audit Logging
The audit logging service (`@/lib/auth/audit.ts`) supports execution inside Prisma transactions to ensure that state changes and audit trail entries commit atomically:

```typescript
import { createAuditLog, logScoreOverride } from '@/lib/auth';

await db.$transaction(async (tx) => {
  // 1. Mutate state
  await tx.teamMatchScore.update(...);

  // 2. Commit audit log atomically
  await logScoreOverride({
    tournamentId,
    matchId,
    userId: session.id,
    beforeScores,
    afterScores,
    reason: overrideReason,
    tx,
  });
});
```

---

## 7. Edge Middleware & Security Headers

Next.js Edge Middleware (`middleware.ts`) automatically injects defensive headers on all incoming HTTP requests:

- `X-Content-Type-Options: nosniff`: Prevents MIME-type sniffing.
- `X-Frame-Options: SAMEORIGIN`: Restricts framing except for `/display` stream overlays (`ALLOWALL`).
- `X-XSS-Protection: 1; mode=block`: Activates browser XSS filtering.
- `Referrer-Policy: strict-origin-when-cross-origin`: Minimizes referrer leakage.
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`: Disables unused browser hardware APIs.
- `Strict-Transport-Security`: Enforces HTTPS in production environments.
- `Content-Security-Policy (CSP)`: Guards against unauthorized script execution.
- `x-trace-id`: Injects a unique distributed tracing UUID for request correlation.

---

## 8. Server-Side Authorization Guards

API Route Handlers utilize the standardized `authorizeRequest` guard from `@/lib/auth/guards`:

```typescript
import { authorizeRequest } from '@/lib/auth';

export async function POST(req: Request) {
  // Authenticate and verify required permission
  const { session, errorResponse } = await authorizeRequest(req, {
    requiredPermission: 'canVerifyScores',
  });
  if (errorResponse) return errorResponse;

  // Proceed with authorized operation using session
  console.log(`Action initiated by ${session.name} (${session.role})`);
}
```

---

## 9. Secret Management & Production Protocol

1. **Environment Variables**:
   - Zero hardcoded secrets in the codebase.
   - All production deployments must configure `DATABASE_URL`, `NEXTAUTH_SECRET`, and `SESSION_SECRET` with cryptographically random tokens (>= 32 characters).
2. **Demo Mode Safeguards**:
   - `ENABLE_DEMO_AUTH="true"` is restricted to local development and staging environments.
   - In production (`NODE_ENV === "production"`), requests must authenticate via valid session tokens or cookies.
