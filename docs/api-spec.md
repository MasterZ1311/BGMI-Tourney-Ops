# BGMI Tournament Control Center — Complete API Specification

**Exclusive Owner**: Agent 3 (Backend / API Engineer)  
**Specification Version**: 2.0.0  
**Target Platform**: BGMI Tournament Control Center (TCC)  
**Standard Response Compliance**: Fully aligned with `/docs/api-contract.md` and `/docs/system-architecture.md`.

---

## 1. Architectural Standards & Response Envelopes

All platform REST endpoints strictly return uniform JSON envelopes. Raw unwrapped objects and primitive strings are strictly prohibited.

### 1.1. Success Response Envelope (HTTP 200, 201)

```typescript
export interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    timestamp: string; // ISO 8601
  };
}
```

**JSON Example**:
```json
{
  "success": true,
  "data": {
    "id": "tourney_bgis_2026",
    "name": "BGMI Pro Invitational 2026",
    "status": "LIVE"
  },
  "message": "Tournament updated successfully",
  "meta": {
    "timestamp": "2026-09-27T10:45:00.000Z"
  }
}
```

### 1.2. Error Response Envelope (HTTP 4xx, 5xx)

```typescript
export interface ApiErrorDetail {
  field?: string;
  message: string;
  rule?: string;
}

export interface ApiErrorEnvelope {
  success: false;
  error: {
    code: string; // Standard error code
    message: string; // Human-readable explanation
    details?: ApiErrorDetail[] | Record<string, unknown> | any[];
    timestamp: string; // ISO 8601
    path?: string; // Request URL path
  };
}
```

**Standard Error Codes**:
- `VALIDATION_ERROR` (HTTP 422): Zod schema validation failed on input payload.
- `NOT_FOUND` (HTTP 404): Requested entity does not exist.
- `CONFLICT` / `PUBLISHED_LOCKED` / `GROUPS_LOCKED` (HTTP 409): Business or operational state violation.
- `DUPLICATE_TEAM_NAME` / `CHARACTER_ID_CONFLICT` (HTTP 409): Roster integrity violation.
- `UNAUTHORIZED` (HTTP 401): Missing or invalid credentials.
- `FORBIDDEN` (HTTP 403): User lacks sufficient RBAC privileges.
- `INTERNAL_SERVER_ERROR` (HTTP 500): Unhandled exception in persistence or runtime.

---

## 2. Security & RBAC Enforcement

### 2.1. Request Role Identification
Clients identify operational roles through request headers:
- `x-user-role: <ROLE>` (e.g. `SUPER_ADMIN`, `TOURNAMENT_ADMIN`, `MATCH_ADMIN`, `SCOREKEEPER`, `OBSERVER`)
- `Authorization: Bearer <ROLE>`
- URL query parameter: `?role=<ROLE>`
- Requests omitting authentication headers default to `OBSERVER` (least-privilege public access).

### 2.2. Room Credential Concealment
1. Endpoints exposing room data (`GET /api/matches/:id/room`, `GET /api/tournaments/:id/matches`, `GET /api/matches/:id`) enforce masking based on role permissions:
   - **Privileged Roles** (`SUPER_ADMIN`, `TOURNAMENT_ADMIN`, `MATCH_ADMIN`): Receive actual in-game room password.
   - **Unprivileged / Public Roles** (`SCOREKEEPER`, `OBSERVER`, unauthenticated): Room password is automatically masked as `"••••••••"`.
2. Public stage displays (`/display`) and unprivileged broadcasts are structurally prevented from leaking lobby passwords.

### 2.3. Immutability of Published Match Scores
- When a match is in `resultStatus === "PUBLISHED"`, standard score modification via `POST /api/matches/:id/results` or state transition via `PATCH /api/matches/:id` is locked and returns **HTTP 409 Conflict** with code `PUBLISHED_LOCKED`.
- Legitimate post-publication corrections require an administrative override payload:
  ```json
  {
    "adminOverride": true,
    "overrideReason": "Official referee adjustment after video review",
    "scores": [ ... ]
  }
  ```
- Every administrative override generates an indelible audit log record (`MATCH_SCORES_OVERRIDDEN`) capturing before-and-after states.

---

## 3. Authoritative Leaderboard Calculation

- The leaderboard endpoint (`GET /api/tournaments/:id/leaderboard`) never executes inline scoring arithmetic.
- All standings, rank assignments, kill totals, placement points, and multi-tier tie-breakers are delegated directly to the pure, side-effect-free scoring engine (`calculateTournamentLeaderboard` in `lib/scoring/engine.ts`).
- Standings reflect only verified and published matches (`resultStatus IN ['VERIFIED', 'PUBLISHED']`) minus active penalties (`Penalty.status === 'ACTIVE'`).

---

## 4. Complete REST API Catalog

### 4.1. Tournaments

#### `GET /api/tournaments`
- **Description**: List all tournaments with squad and match counts.
- **Min Role**: `OBSERVER`
- **Response**: `ApiSuccessEnvelope<TournamentEntity[]>`

#### `POST /api/tournaments`
- **Description**: Create new tournament with settings and scoring rule config.
- **Min Role**: `TOURNAMENT_ADMIN`
- **Validation Schema**: `TournamentCreateSchema`
- **Response**: `ApiSuccessEnvelope<TournamentEntity>` (HTTP 201)

#### `GET /api/tournaments/:id`
- **Description**: Get single tournament with settings, scoring rule, and group summaries.
- **Min Role**: `OBSERVER`
- **Response**: `ApiSuccessEnvelope<TournamentEntity>`

#### `PATCH /api/tournaments/:id`
- **Description**: Update tournament metadata or operational status. Finalized tournaments reject status edits with 409 Conflict.
- **Min Role**: `TOURNAMENT_ADMIN`
- **Validation Schema**: `TournamentUpdateSchema`
- **Response**: `ApiSuccessEnvelope<TournamentEntity>`

#### `DELETE /api/tournaments/:id`
- **Description**: Delete tournament and cascading associations.
- **Min Role**: `SUPER_ADMIN`
- **Response**: `ApiSuccessEnvelope<{ deleted: true, id: string }>`

#### `POST /api/tournaments/:id/finalize`
- **Description**: Run pre-flight audit checklist (100% matches completed & verified, 0 open disputes). If checks pass, locks tournament (`isFinalized: true`).
- **Min Role**: `TOURNAMENT_ADMIN`
- **Validation Schema**: `TournamentFinalizeSchema`
- **Response**: `ApiSuccessEnvelope<{ tournament: TournamentEntity, checklist: AuditItem[] }>`

---

### 4.2. Teams & Rosters

#### `GET /api/tournaments/:id/teams`
- **Description**: List registered teams with player rosters, attendance, and penalties. Filterable by `?groupId=...` and `?status=...`.
- **Min Role**: `OBSERVER`
- **Response**: `ApiSuccessEnvelope<TeamEntity[]>`

#### `POST /api/tournaments/:id/teams`
- **Description**: Register single squad with roster. Rejects duplicate squad names and player Character ID collisions with 409 Conflict.
- **Min Role**: `MATCH_ADMIN`
- **Validation Schema**: `TeamCreateSchema`
- **Response**: `ApiSuccessEnvelope<TeamEntity>` (HTTP 201)

#### `POST /api/tournaments/:id/teams/import`
- **Description**: Bulk import squads from parsed CSV. Validates Character ID collisions across teams and database. Supports `dryRun: true`.
- **Min Role**: `MATCH_ADMIN`
- **Validation Schema**: `TeamBulkImportSchema`
- **Response**: `ApiSuccessEnvelope<{ importedCount: number, skippedCount: number, errors: any[] }>`

#### `GET /api/teams/:id`
- **Description**: Get single team record with players and recent attendance logs.
- **Min Role**: `OBSERVER`
- **Response**: `ApiSuccessEnvelope<TeamEntity>`

#### `PATCH /api/teams/:id`
- **Description**: Update squad metadata, group assignment, verification, or operational status (`ACTIVE`, `DISQUALIFIED`, `WITHDRAWN`).
- **Min Role**: `MATCH_ADMIN`
- **Validation Schema**: `TeamUpdateSchema`
- **Response**: `ApiSuccessEnvelope<TeamEntity>`

#### `DELETE /api/teams/:id`
- **Description**: Remove squad from tournament.
- **Min Role**: `TOURNAMENT_ADMIN`
- **Response**: `ApiSuccessEnvelope<{ deleted: true, id: string }>`

---

### 4.3. Groups & Seeding

#### `GET /api/tournaments/:id/groups`
- **Description**: List groups with allocated squads and match counts.
- **Min Role**: `OBSERVER`
- **Response**: `ApiSuccessEnvelope<GroupEntity[]>`

#### `POST /api/tournaments/:id/groups`
- **Description**: Create new group.
- **Min Role**: `TOURNAMENT_ADMIN`
- **Validation Schema**: `GroupCreateSchema`
- **Response**: `ApiSuccessEnvelope<GroupEntity>` (HTTP 201)

#### `GET /api/groups/:id`
- **Description**: Get group details and assigned squads.
- **Min Role**: `OBSERVER`
- **Response**: `ApiSuccessEnvelope<GroupEntity>`

#### `PATCH /api/groups/:id`
- **Description**: Update group name, lock state, or assign/remove squads (`addTeamId`, `removeTeamId`).
- **Min Role**: `TOURNAMENT_ADMIN`
- **Validation Schema**: `GroupUpdateSchema`
- **Response**: `ApiSuccessEnvelope<GroupEntity>`

#### `DELETE /api/groups/:id`
- **Description**: Dissolve group and unassign member squads.
- **Min Role**: `TOURNAMENT_ADMIN`
- **Response**: `ApiSuccessEnvelope<{ deleted: true, id: string }>`

#### `PATCH /api/tournaments/:id/groups/lock`
- **Description**: Bulk lock or unlock group allocations.
- **Min Role**: `TOURNAMENT_ADMIN`
- **Validation Schema**: `GroupLockSchema`
- **Response**: `ApiSuccessEnvelope<{ isLocked: boolean }>`

#### `POST /api/tournaments/:id/groups/randomize`
- **Description**: Seeded pseudo-random shuffle of active squads across groups. Blocks with 409 Conflict if groups are locked.
- **Min Role**: `TOURNAMENT_ADMIN`
- **Validation Schema**: `GroupRandomizeSchema`
- **Response**: `ApiSuccessEnvelope<{ seed: number, groupCount: number, distributedTeams: number }>`

---

### 4.4. Matches & Room Operations

#### `GET /api/tournaments/:id/matches`
- **Description**: List matches with schedule, map, perspective, and room status. Room password masked if unauthorized. Filterable by `?groupId=...` and `?status=...`.
- **Min Role**: `OBSERVER`
- **Response**: `ApiSuccessEnvelope<MatchEntity[]>`

#### `POST /api/tournaments/:id/matches`
- **Description**: Create single match or generate multi-match sequential schedule with map rotation (`generateBatch: true`).
- **Min Role**: `TOURNAMENT_ADMIN`
- **Validation Schema**: `MatchCreateSchema` or `MatchBatchScheduleSchema`
- **Response**: `ApiSuccessEnvelope<MatchEntity | MatchEntity[]>` (HTTP 201)

#### `GET /api/matches/:id`
- **Description**: Single match details, room status (masked if unprivileged), and scores.
- **Min Role**: `OBSERVER`
- **Response**: `ApiSuccessEnvelope<MatchEntity>`

#### `PATCH /api/matches/:id`
- **Description**: Update match schedule, map, or status transition (`SCHEDULED` -> `READY` -> `OPEN` -> `LIVE` -> `COMPLETED`).
- **Min Role**: `MATCH_ADMIN`
- **Validation Schema**: `MatchUpdateSchema`
- **Response**: `ApiSuccessEnvelope<MatchEntity>`

#### `GET /api/matches/:id/room`
- **Description**: Retrieve custom room ID and credentials. Password is automatically masked (`"••••••••"`) for unauthenticated users, `OBSERVER`, and `SCOREKEEPER`.
- **Min Role**: `OBSERVER`
- **Response**: `ApiSuccessEnvelope<RoomEntity>`

#### `PUT /api/matches/:id/room` & `PATCH /api/matches/:id/room`
- **Description**: Upsert room ID, password, and room operational status (`READY`, `OPEN`, `LIVE`, `CLOSED`). Syncs match state to `OPEN` or `LIVE`.
- **Min Role**: `MATCH_ADMIN`
- **Validation Schema**: `RoomUpdateSchema`
- **Response**: `ApiSuccessEnvelope<RoomEntity>`

---

### 4.5. Score Entry & Results Lifecycle

#### `GET /api/matches/:id/results`
- **Description**: Fetch recorded scores for a match with team details and points breakdown.
- **Min Role**: `SCOREKEEPER`
- **Response**: `ApiSuccessEnvelope<{ matchId: string, resultStatus: string, scores: TeamMatchScore[] }>`

#### `POST /api/matches/:id/results`
- **Description**: Submit score rows for lobby squads. Calculates points using pure scoring engine. If match is `PUBLISHED`, direct submission returns **409 Conflict** unless accompanied by `adminOverride: true` and `overrideReason`.
- **Min Role**: `SCOREKEEPER`
- **Validation Schema**: `MatchResultSubmissionSchema`
- **Response**: `ApiSuccessEnvelope<{ matchId: string, resultStatus: string, scores: CalculatedScore[] }>`

#### `POST /api/matches/:id/verify`
- **Description**: Referees verify score integrity (`SUBMITTED` -> `VERIFIED`).
- **Min Role**: `TOURNAMENT_ADMIN`
- **Validation Schema**: `MatchVerifySchema`
- **Response**: `ApiSuccessEnvelope<MatchEntity>`

#### `POST /api/matches/:id/publish`
- **Description**: Publish verified scores to live leaderboard and public broadcasts (`VERIFIED` -> `PUBLISHED`). Locks results from direct modification.
- **Min Role**: `TOURNAMENT_ADMIN`
- **Validation Schema**: `MatchPublishSchema`
- **Response**: `ApiSuccessEnvelope<MatchEntity>`

---

### 4.6. Leaderboard & Standings

#### `GET /api/tournaments/:id/leaderboard`
- **Description**: Live cumulative tournament leaderboard. Purely computed by `calculateTournamentLeaderboard` in `lib/scoring/engine.ts`. Evaluates WWCD, placement points, kill points, bonuses, active penalties, and multi-tier tie-breakers. Filterable by `?groupId=...` and `?matchId=...`.
- **Min Role**: `OBSERVER`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "tournamentName": "BGMI Pro Invitational 2026",
      "totalMatchesCount": 4,
      "scoringRuleName": "Official BGIS 10-Point System",
      "standings": [
        {
          "rank": 1,
          "teamId": "team_godl",
          "teamName": "GodLike Esports",
          "teamTag": "GODL",
          "matchesPlayed": 4,
          "wwcdCount": 2,
          "placementPoints": 28,
          "killPoints": 32,
          "bonusPoints": 0,
          "penaltyPoints": 0,
          "totalPoints": 60,
          "bestMatchScore": 24,
          "lastMatchPlacement": 1
        }
      ]
    }
  }
  ```

---

### 4.7. Attendance

#### `GET /api/tournaments/:id/attendance`
- **Description**: Fetch squad check-in logs and aggregate operational attendance summary.
- **Min Role**: `OBSERVER`
- **Response**: `ApiSuccessEnvelope<{ records: AttendanceRecord[], summary: AttendanceSummary }>`

#### `POST /api/tournaments/:id/attendance`
- **Description**: Mark squad attendance (`PRESENT`, `ABSENT`, `LATE`, `DISQUALIFIED`, `WITHDRAWN`) or bulk mark all active squads (`bulkMarkAllPresent: true`).
- **Min Role**: `MATCH_ADMIN`
- **Validation Schema**: `AttendanceMarkSchema` or `AttendanceBulkMarkSchema`
- **Response**: `ApiSuccessEnvelope<AttendanceRecord | { updatedCount: number }>`

---

### 4.8. Penalties & Disputes

#### `GET /api/tournaments/:id/penalties`
- **Description**: List all penalties issued in tournament.
- **Min Role**: `OBSERVER`
- **Response**: `ApiSuccessEnvelope<PenaltyRecord[]>`

#### `POST /api/tournaments/:id/penalties`
- **Description**: Issue point deduction penalty to squad for rule violation. Automatically reduces cumulative score on leaderboard.
- **Min Role**: `TOURNAMENT_ADMIN`
- **Validation Schema**: `PenaltyCreateSchema`
- **Response**: `ApiSuccessEnvelope<PenaltyRecord>` (HTTP 201)

#### `GET /api/penalties/:id`
- **Description**: Retrieve single penalty details.
- **Min Role**: `OBSERVER`
- **Response**: `ApiSuccessEnvelope<PenaltyRecord>`

#### `PATCH /api/penalties/:id` & `PATCH /api/penalties/:id/void`
- **Description**: Void penalty with audit reason. Restores deducted points on live leaderboard.
- **Min Role**: `TOURNAMENT_ADMIN`
- **Validation Schema**: `PenaltyVoidSchema`
- **Response**: `ApiSuccessEnvelope<PenaltyRecord>`

#### `DELETE /api/penalties/:id`
- **Description**: Delete penalty record.
- **Min Role**: `SUPER_ADMIN`
- **Response**: `ApiSuccessEnvelope<{ deleted: true, id: string }>`

#### `GET /api/tournaments/:id/disputes`
- **Description**: List team protest and dispute tickets.
- **Min Role**: `OBSERVER`
- **Response**: `ApiSuccessEnvelope<DisputeRecord[]>`

#### `POST /api/tournaments/:id/disputes`
- **Description**: File new dispute ticket under `SCORING`, `ROSTER`, `BEHAVIOR`, or `TECHNICAL`.
- **Min Role**: `MATCH_ADMIN`
- **Validation Schema**: `DisputeCreateSchema`
- **Response**: `ApiSuccessEnvelope<DisputeRecord>` (HTTP 201)

#### `GET /api/disputes/:id`
- **Description**: Get single dispute details.
- **Min Role**: `OBSERVER`
- **Response**: `ApiSuccessEnvelope<DisputeRecord>`

#### `PATCH /api/disputes/:id`
- **Description**: Adjudicate dispute ticket (`OPEN`, `UNDER_REVIEW`, `ACCEPTED`, `REJECTED`, `RESOLVED`) with referee resolution notes.
- **Min Role**: `TOURNAMENT_ADMIN`
- **Validation Schema**: `DisputeUpdateSchema`
- **Response**: `ApiSuccessEnvelope<DisputeRecord>`

#### `DELETE /api/disputes/:id`
- **Description**: Delete dispute record.
- **Min Role**: `SUPER_ADMIN`
- **Response**: `ApiSuccessEnvelope<{ deleted: true, id: string }>`

---

### 4.9. Audit Logs & System Operations

#### `GET /api/tournaments/:id/audit-logs`
- **Description**: Fetch audit trail logs capturing critical mutations, score overrides, and lifecycle events.
- **Min Role**: `TOURNAMENT_ADMIN`
- **Response**: `ApiSuccessEnvelope<AuditLogEntry[]>`

#### `POST /api/demo/seed`
- **Description**: Recreate fully populated mock tournament ("BGMI Pro Invitational 2026") featuring 16 esports squads, 4 groups, 4 matches, and active standings.
- **Min Role**: `SUPER_ADMIN`
- **Response**: `ApiSuccessEnvelope<{ tournamentId: string, name: string, message: string }>`

#### `POST /api/demo/reset`
- **Description**: Cleanly reset demo tournament to initial match-day state.
- **Min Role**: `SUPER_ADMIN`
- **Response**: `ApiSuccessEnvelope<{ tournamentId: string, name: string, message: string }>`
