# BGMI Tournament Organizer Platform — API Contract

## 1. Owner & Scope

- **Exclusive Agent Owner**: **Agent 3 (Backend / API Engineer)**
- **Owned Paths**:
  - `app/api/**/route.ts`
  - Backend controllers & services (e.g. `lib/services/**`)
  - Server-side validation schemas (`lib/validation/schemas.ts`)
  - `docs/api-spec.md`
- **Prohibited Modifications**:
  - Frontend components (`components/**`, `app/(dashboard)/**`)
  - UI styling (`tailwind.config.js`, CSS)
  - Database schema (`prisma/schema.prisma`)
  - Core scoring calculation algorithms (`lib/scoring/engine.ts`)
  - Tournament scheduling algorithms (`lib/tournament/engine.ts`)

> ### 🛑 STOP CONDITION
> If completing your task requires modifying a file owned by another agent, DO NOT modify that file. Instead, record the required interface/change in [`/tasks/integration-needed.md`](file:///e:/Github/BGMI%20Brackets/tasks/integration-needed.md), continue working on everything else that is independently possible, and report the dependency.

---

## 2. API Design Conventions

1. **RESTful Architecture**: Resources are nouns in plural (e.g. `/api/tournaments`, `/api/matches`).
2. **Deterministic Envelopes**: All endpoints must return standard JSON envelopes.
3. **No Direct Business Math in Handlers**: Route handlers must delegate business logic to dedicated services (`lib/scoring`, `lib/tournament`, or service layers) and persist through Prisma (`lib/db.ts`).
4. **Authoritative Server Validation**: All incoming requests must be parsed using Zod schemas (`lib/validation/schemas.ts`).

---

## 3. Standard Response Envelope Specification

### 3.1. Success Response (HTTP 200 / 201)
```typescript
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    timestamp: string;
  };
}
```

### 3.2. Error Response (HTTP 4xx / 5xx)
```typescript
export interface ApiErrorDetail {
  field?: string;
  message: string;
  rule?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string; // e.g. "VALIDATION_ERROR", "UNAUTHORIZED", "NOT_FOUND", "MATCH_CONFLICT", "PUBLISHED_LOCKED"
    message: string;
    details?: ApiErrorDetail[] | Record<string, unknown>;
    timestamp: string;
    path?: string;
  };
}
```

### 3.3. Standard HTTP Status Codes
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Malformed syntax or invalid parameter.
- `401 Unauthorized`: Missing or invalid authentication token.
- `403 Forbidden`: Authenticated user lacks permission for action.
- `404 Not Found`: Requested resource does not exist.
- `409 Conflict`: Business conflict (e.g., room collision, published result lock).
- `422 Unprocessable Entity`: Zod schema validation failed.
- `500 Internal Server Error`: Unhandled server exception.

---

## 4. REST Resource Catalog

### 4.1. Tournaments
| Method | Route | Description | Min Role |
|---|---|---|---|
| `GET` | `/api/tournaments` | List all tournaments with filters | `OBSERVER` |
| `POST` | `/api/tournaments` | Create new tournament with wizard config | `TOURNAMENT_ADMIN` |
| `GET` | `/api/tournaments/[id]` | Get detailed tournament record | `OBSERVER` |
| `PATCH` | `/api/tournaments/[id]` | Update tournament metadata / rules | `TOURNAMENT_ADMIN` |
| `POST` | `/api/tournaments/[id]/finalize` | Audit & execute tournament lock | `TOURNAMENT_ADMIN` |

### 4.2. Teams & Rosters
| Method | Route | Description | Min Role |
|---|---|---|---|
| `GET` | `/api/tournaments/[id]/teams` | List registered squads & rosters | `OBSERVER` |
| `POST` | `/api/tournaments/[id]/teams` | Register single squad with players | `MATCH_ADMIN` |
| `POST` | `/api/tournaments/[id]/teams/import` | Bulk CSV import with pre-validation | `MATCH_ADMIN` |
| `PATCH` | `/api/teams/[id]` | Update squad details, verify, disqualify | `MATCH_ADMIN` |

### 4.3. Groups & Seeding
| Method | Route | Description | Min Role |
|---|---|---|---|
| `GET` | `/api/tournaments/[id]/groups` | List groups with assigned squads | `OBSERVER` |
| `POST` | `/api/tournaments/[id]/groups` | Create groups or run seeded shuffle | `TOURNAMENT_ADMIN` |
| `PATCH` | `/api/groups/[id]` | Move squad or toggle group lock | `TOURNAMENT_ADMIN` |

### 4.4. Matches & Room Operations
| Method | Route | Description | Min Role |
|---|---|---|---|
| `GET` | `/api/tournaments/[id]/matches` | List matches with schedule & status | `OBSERVER` |
| `POST` | `/api/tournaments/[id]/matches` | Generate match schedule / add match | `TOURNAMENT_ADMIN` |
| `GET` | `/api/matches/[id]` | Single match details & sloted squads | `OBSERVER` |
| `PATCH` | `/api/matches/[id]` | Update match status (START, LIVE, END) | `MATCH_ADMIN` |
| `GET` | `/api/matches/[id]/room` | Get room info (masked for observers) | `OBSERVER` |
| `PUT` | `/api/matches/[id]/room` | Update room ID, password, room state | `MATCH_ADMIN` |

### 4.5. Attendance
| Method | Route | Description | Min Role |
|---|---|---|---|
| `GET` | `/api/tournaments/[id]/attendance` | Retrieve match-day check-in logs | `OBSERVER` |
| `POST` | `/api/tournaments/[id]/attendance` | Mark squad attendance (single / bulk) | `MATCH_ADMIN` |

### 4.6. Score Entry & Result Lifecycle
| Method | Route | Description | Min Role |
|---|---|---|---|
| `GET` | `/api/matches/[id]/results` | Fetch draft / verified match scores | `SCOREKEEPER` |
| `POST` | `/api/matches/[id]/results` | Save / submit raw score entry rows | `SCOREKEEPER` |
| `POST` | `/api/matches/[id]/verify` | Transition result `SUBMITTED` -> `VERIFIED` | `TOURNAMENT_ADMIN` |
| `POST` | `/api/matches/[id]/publish` | Finalize & publish score to leaderboard | `TOURNAMENT_ADMIN` |

### 4.7. Leaderboard, Penalties & Disputes
| Method | Route | Description | Min Role |
|---|---|---|---|
| `GET` | `/api/tournaments/[id]/leaderboard` | Live standings calculated by engine | `OBSERVER` |
| `GET` | `/api/tournaments/[id]/penalties` | List penalty deductions | `OBSERVER` |
| `POST` | `/api/tournaments/[id]/penalties` | Issue penalty deduction | `TOURNAMENT_ADMIN` |
| `PATCH` | `/api/penalties/[id]` | Void penalty (with audit reason) | `TOURNAMENT_ADMIN` |
| `GET` | `/api/tournaments/[id]/disputes` | List team protests & disputes | `OBSERVER` |
| `POST` | `/api/tournaments/[id]/disputes` | Log team protest ticket | `MATCH_ADMIN` |
| `PATCH` | `/api/disputes/[id]` | Adjudicate dispute (ACCEPT / REJECT) | `TOURNAMENT_ADMIN` |

---

## 5. Security & Published Result Immutability

1. **Password Concealment**:
   - `GET /api/matches/[id]/room` must omit or mask `password` (e.g. `"••••••••"`) unless the requesting user possesses `canSeeRoomPasswords: true`.
2. **Published Lock**:
   - When a match has `resultStatus === "PUBLISHED"`, direct score edits via `/api/matches/[id]/results` must return HTTP `409 Conflict`.
   - Modifying a published result requires an explicit administrative override action with an audit trail entry in `AuditLog`.
