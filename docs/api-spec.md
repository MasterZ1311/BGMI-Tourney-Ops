# BGMI Tournament Control Center — API Specification

## 1. Conventions & Standards
- Base URL: `/api`
- Content-Type: `application/json`
- Standard Response Envelope:
  ```json
  {
    "success": true,
    "data": { ... },
    "error": null,
    "timestamp": "2026-09-27T08:30:00.000Z"
  }
  ```
- Error Response Envelope:
  ```json
  {
    "success": false,
    "data": null,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Placement rank #1 is duplicated.",
      "details": [ ... ]
    },
    "timestamp": "2026-09-27T08:30:00.000Z"
  }
  ```

## 2. API Endpoints Catalog

### 2.1 Tournaments
- `GET /api/tournaments`
  - List all tournaments with status, date, team counts, and match progress.
- `POST /api/tournaments`
  - Create tournament with nested settings and default scoring rules.
- `GET /api/tournaments/:id`
  - Detailed tournament payload including settings, groups, scoring rule, and live summary.
- `PATCH /api/tournaments/:id`
  - Update tournament information or advance lifecycle status.
- `POST /api/tournaments/:id/finalize`
  - Runs pre-flight audit checklist and finalizes tournament if valid.

### 2.2 Teams & Rosters
- `GET /api/tournaments/:id/teams`
  - Fetch tournament teams with rosters, attendance, group, and cumulative stats.
- `POST /api/tournaments/:id/teams`
  - Register single team with starting lineup and substitutes.
- `POST /api/tournaments/:id/teams/import`
  - Bulk import teams from parsed CSV payload with validation and mapping.
- `PATCH /api/teams/:id`
  - Update team details, verification status, or disqualification.
- `POST /api/teams/:id/players`
  - Add or update player in roster.

### 2.3 Groups & Brackets
- `GET /api/tournaments/:id/groups`
  - Get groups and their allocated teams.
- `POST /api/tournaments/:id/groups`
  - Create new group.
- `POST /api/tournaments/:id/groups/randomize`
  - Deterministic seeded shuffle of active teams across groups.
- `PATCH /api/tournaments/:id/groups/lock`
  - Lock or unlock groups.

### 2.4 Matches & Schedule
- `GET /api/tournaments/:id/matches`
  - Fetch scheduled matches with room status and results status.
- `POST /api/tournaments/:id/matches`
  - Create match or batch generate match schedule.
- `GET /api/matches/:id`
  - Single match details including room, assigned teams, and score records.
- `PATCH /api/matches/:id`
  - Update match details or transition status (`SCHEDULED` -> `READY` -> `OPEN` -> `LIVE` -> `COMPLETED`).

### 2.5 Room Operations
- `GET /api/matches/:id/room`
  - Fetch room credentials (masked if unprivileged).
- `PATCH /api/matches/:id/room`
  - Update Room ID, Password, and Status (`OPEN`, `LIVE`, `CLOSED`).

### 2.6 Attendance
- `GET /api/tournaments/:id/attendance`
  - Fetch attendance sheet with team status.
- `POST /api/tournaments/:id/attendance`
  - Mark attendance (individual or bulk) with staff timestamp.

### 2.7 Scores & Results
- `POST /api/matches/:id/results`
  - Save or submit match scores for all 16 teams. Runs scoring engine computations.
  - Payload: `{ resultStatus: "DRAFT"|"SUBMITTED", scores: [{ teamId, placement, kills, bonus, penalty, notes }] }`
- `POST /api/matches/:id/verify`
  - Admin verification endpoint (`SUBMITTED` -> `VERIFIED`).
- `POST /api/matches/:id/publish`
  - Admin publishing endpoint (`VERIFIED` -> `PUBLISHED`). Updates official leaderboard and creates audit log.

### 2.8 Leaderboard & Standings
- `GET /api/tournaments/:id/leaderboard`
  - Computed live leaderboard aggregated from verified match results.
  - Supports filters: `?groupId=...`, `?matchId=...`.

### 2.9 Penalties & Disputes
- `GET /api/tournaments/:id/penalties`
  - List all active and voided penalties.
- `POST /api/tournaments/:id/penalties`
  - Issue penalty with reason and point deduction. Logs audit entry.
- `PATCH /api/penalties/:id/void`
  - Void penalty with reason.
- `GET /api/tournaments/:id/disputes`
  - List all disputes.
- `POST /api/tournaments/:id/disputes`
  - File dispute.
- `PATCH /api/disputes/:id`
  - Update dispute status (`UNDER_REVIEW`, `ACCEPTED`, `REJECTED`, `RESOLVED`) and resolution notes.

### 2.10 Demo Data Controls
- `POST /api/demo/seed`
  - Seeds a tournament ("BGMI Pro Invitational 2026") with 32 teams, 4 groups, 4 matches, realistic scores, penalties, and live match ready for testing.
- `POST /api/demo/reset`
  - Cleans demo tournaments while preserving production data.
