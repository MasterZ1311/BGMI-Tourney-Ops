# BGMI Tournament Control Center — Security Architecture & Threat Model

## 1. Threat Model & Mitigation Matrix

| Threat Category | Potential Attack Vector | Mitigation Strategy |
|---|---|---|
| **Lobby Credential Leakage** | Unauthorized players getting Room ID & Password to grief tournament lobby | Room credentials masked on unauthenticated endpoints, stripped from public `/display` mode, and restricted to verified staff roles. |
| **Tampering with Scores** | Rogue scorekeeper altering points without authorization | 4-tier verification workflow (`DRAFT` -> `SUBMITTED` -> `VERIFIED` -> `PUBLISHED`). Mandatory immutable `AuditLog` entry for any score modification after match completion. |
| **Input Injection & Exploitation** | Malicious CSV files or SQL/NoSQL payload injection in team import or team names | Strict Zod payload schema validation, Prisma parameterization (immune to SQL injection), and HTML-escaping across client rendering. |
| **Unauthorized Lifecycle State Skipping** | Finalizing tournament with missing scores or jumping matches directly to published | Strict State Machine transition guards in the backend Tournament Engine. State changes rejected with descriptive 400 Bad Request errors. |
| **Data Leakage in Public Display** | Display mode exposing staff notes, player phone numbers, or passwords | Public display endpoint (`/display`) selects only projected public fields (`Team.name`, `Team.tag`, `Match.title`, `LeaderboardEntry`). |

## 2. Role-Based Access Control (RBAC) Matrix

| Permission / Action | SUPER_ADMIN | TOURNAMENT_ADMIN | MATCH_ADMIN | SCOREKEEPER | OBSERVER | PUBLIC |
|---|---|---|---|---|---|---|
| Create/Edit Tournament | Yes | Yes | No | No | No | No |
| Finalize Tournament | Yes | Yes | No | No | No | No |
| View Room Passwords | Yes | Yes | Yes | No | No | No |
| Change Match State | Yes | Yes | Yes | No | No | No |
| Enter/Draft Scores | Yes | Yes | Yes | Yes | No | No |
| Verify Scores | Yes | Yes | No | No | No | No |
| Issue Penalties | Yes | Yes | No | No | No | No |
| View Audit Logs | Yes | Yes | No | No | No | No |
| View Public Leaderboard | Yes | Yes | Yes | Yes | Yes | Yes |

## 3. Secret Management
- Zero secrets committed to version control.
- Enforced `.env.example` validation on server initialization.
