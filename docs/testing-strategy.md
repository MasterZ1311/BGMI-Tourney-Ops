# BGMI Tournament Control Center — Comprehensive Testing Strategy

## 1. Executive Summary & Quality Assurance Mission
The **BGMI Tournament Control Center (TCC)** handles high-density, mission-critical esports operations where points, placements, and disqualifications determine tournament outcomes and prize purse distributions.

The QA & Automated Testing Strategy guarantees:
1. **Mathematical Invariance**: 100% deterministic calculation of match points, WWCD bonuses, cumulative leaderboards, and multi-tier tie-breakers across all official rule presets (BGIS 10-Point, BMPS 15-Point, PMCO 20-Point).
2. **State Machine Integrity**: Strict enforcement of valid operational state transitions across tournament lifecycles and individual match statuses, preventing illegal race conditions and premature state advancements.
3. **Data Boundary Enforcement**: Exhaustive schema and parameter validation across all incoming operational payloads (rosters, rooms, check-ins, scores, penalties, and dispute protests).
4. **Security & RBAC Protection**: Strict role-based isolation preventing credential leakage (e.g. secret room passwords) and unauthorized score modifications.
5. **Zero-Flake E2E Verifiability**: Automated simulation of the entire 14-step tournament organizer journey from initial configuration to finalized tournament lock.

---

## 2. Test Architecture Pyramid

```
                / \
               /   \
              / E2E \       -> Complete 14-Step Tournament Director Journey
             /-------\         (Setup -> Onboard -> Seed -> Schedule -> Check-In ->
            /         \         Live -> Score -> Verify -> Publish -> Penalize -> Finalize)
           /   INTEG   \    -> Multi-tier tie-breakers, leaderboard penalty aggregation,
          /-------------\      pre-flight audit checklist, RBAC credential masking
         /               \
        /      UNIT       \ -> Pure scoring algorithms, deterministic pseudo-random seeding,
       /-------------------\   schedule collision detection, state transitions, Zod schemas
```

---

## 3. Dual-Engine Test Execution Architecture

The platform supports two complementary test execution workflows:

| Runner | Execution Command | Engine / Tool | Primary Purpose |
|---|---|---|---|
| **Master Test Suite** | `npm test` | Node.js + esbuild bundle (`scripts/test-runner.ts`) | Lightning-fast (<100ms) standalone build-time verification across all 11 key operational domains. Zero devDependencies required in production. |
| **Comprehensive Vitest Suite** | `npx vitest run` | Vitest 2.1.3 + Node environment | Exhaustive test runner with deep assertion trees, modular domain suites in `tests/**`, code coverage reporting, and watch mode support. |

---

## 4. Key Domain Test Matrix & Coverage Catalog

### 4.1. Tournament Domain
- **Files**: `tests/tournament-lifecycle.test.ts`, `tests/tournament.test.ts`, `scripts/test-runner.ts`
- **Scope**:
  - `TournamentCreateSchema` validation (name min 3 chars, organizer, date format, default caps).
  - Lifecycle state machine: `DRAFT` ➔ `REGISTRATION` ➔ `CHECK_IN` ➔ `GROUPS_LOCKED` ➔ `SCHEDULED` ➔ `LIVE` ➔ `RESULTS_REVIEW` ➔ `COMPLETED` ➔ `ARCHIVED`.
  - Operational contextual transition guards:
    - `REGISTRATION` ➔ `CHECK_IN`: Requires minimum registered teams (`minTeams`).
    - `CHECK_IN` ➔ `GROUPS_LOCKED`: Requires groups configured and populated.
    - `GROUPS_LOCKED` ➔ `SCHEDULED`: Requires groups to be locked.
    - `SCHEDULED` ➔ `LIVE`: Requires rooms initialized.
    - `LIVE` ➔ `RESULTS_REVIEW`: Requires all scheduled matches completed.
    - `RESULTS_REVIEW` ➔ `COMPLETED`: Requires 100% pre-flight audit pass.
  - Terminal status: `ARCHIVED` cannot transition to any subsequent status.

### 4.2. Teams & Rosters Domain
- **Files**: `tests/teams-rosters.test.ts`, `scripts/test-runner.ts`
- **Scope**:
  - `TeamCreateSchema` validation (squad name min 2 chars, squad tag 2-6 chars, captain contact info).
  - Player roster integrity: `characterId` (minimum 5 digits), in-game name (IGN), player roles (`CAPTAIN`, `ASSAULTER`, `SNIPER`, `SUPPORT`, `IGL`), starting lineup vs. substitute flag.
  - Roster export formatter (`exportRostersToCsv`): Validates column ordering, CSV escaping, and accurate starter vs substitute labeling.

### 4.3. Groups & Seeding Domain
- **Files**: `tests/groups-seeding.test.ts`, `tests/tournament.test.ts`, `scripts/test-runner.ts`
- **Scope**:
  - Balanced distribution math: `distributeTeamsToGroups` partitions teams evenly across $N$ groups (e.g. 16 teams / 4 groups = 4 per group; handles uneven counts like 17 teams / 4 groups = 5, 4, 4, 4).
  - Deterministic pseudo-random seeding: Mulberry32 PRNG ensures identical seeds yield identical group allocations across multiple runs.
  - Group locking guard: Throws error when attempting to reshuffle while `isLocked: true` or if any individual group is locked.
  - Group metadata generation (`generateBalancedGroups`): Produces structured objects with group names, indices, team lists, and team IDs.

### 4.4. Matches & Scheduling Domain
- **Files**: `tests/matches-scheduling.test.ts`, `tests/tournament.test.ts`, `scripts/test-runner.ts`
- **Scope**:
  - Sequential timetable generation (`generateMatchSchedule`): Automatically calculates match start times based on `matchDurationMinutes` and `breakDurationMinutes`.
  - Map rotation: Sequential cycling through standard BGMI maps (`ERANGEL`, `MIRAMAR`, `SANHOK`, `VIKENDI`).
  - Match operational lifecycle: `SCHEDULED` ➔ `READY` ➔ `OPEN` ➔ `LIVE` ➔ `COMPLETED` ➔ `VERIFIED` ➔ `PUBLISHED`.
  - Administrative correction: Supports single-step rollback from `PUBLISHED` to `VERIFIED`.
  - Conflict detection (`detectMatchConflicts`):
    - Concurrency conflict: Flags when the same team or group is scheduled in overlapping time windows.
    - Duration guard: Rejects match duration $\le 0$ minutes.
    - Past start times: Detects past timestamps when configured.

### 4.5. Rooms & Security Domain
- **Files**: `tests/rooms-attendance.test.ts`, `tests/tournament.test.ts`, `scripts/test-runner.ts`
- **Scope**:
  - Room double-booking detection: Rejects scheduling two overlapping matches with the same room ID.
  - Sequential room reuse: Permits same room ID if matches are staggered with sufficient time buffer.
  - `RoomUpdateSchema` validation: Validates room ID, password, and operational status (`NOT_CREATED`, `READY`, `OPEN`, `LIVE`, `COMPLETED`, `CLOSED`).
  - RBAC room password concealment:
    - `SUPER_ADMIN`, `TOURNAMENT_ADMIN`, `MATCH_ADMIN`: Allowed to see room passwords (`canSeeRoomPasswords: true`).
    - `SCOREKEEPER`, `OBSERVER`: Strictly forbidden from seeing room passwords (`canSeeRoomPasswords: false`).

### 4.6. Attendance Domain
- **Files**: `tests/rooms-attendance.test.ts`, `scripts/test-runner.ts`
- **Scope**:
  - `AttendanceMarkSchema` validation.
  - Check-in status validation: `PRESENT`, `ABSENT`, `LATE`, `DISQUALIFIED`, `WITHDRAWN`.
  - Rejection of unknown statuses or empty team IDs.
  - Staff attribution: Captures `checkedInBy` marshal identifier for audit logging.

### 4.7. Scoring Engine Domain
- **Files**: `tests/scoring.test.ts`, `scripts/test-runner.ts`
- **Scope**:
  - Official scoring rule presets:
    - **BGIS 10-Point**: 1st (10), 2nd (6), 3rd (5), 4th (4), 5th (3), 6th (2), 7th (1), 8th (1), 9th-16th (0).
    - **BMPS 15-Point**: 1st (15), 2nd (12), 3rd (10), 4th (8), 5th (6), 6th (4), 7th (2), 8th (1), 9th-16th (0).
    - **PMCO 20-Point**: 1st (20), 2nd (14), 3rd (10), 4th (8), 5th (7), 6th (6), 7th (5), 8th (4), 9th (3), 10th (2), 11th-16th (1).
  - Pure calculation: Decoupled from database, side-effect free.
  - WWCD bonus point calculation.
  - Multi-tier tie-breaker resolution hierarchy:
    1. Total Points (descending)
    2. Total WWCDs
    3. Total Placement Points
    4. Total Kill Points
    5. Highest Single Match Score
    6. Most Recent Match Placement Rank
    7. Alphabetical Team Name Fallback

### 4.8. Results & Score Entry Domain
- **Files**: `tests/results-lifecycle.test.ts`, `scripts/test-runner.ts`
- **Scope**:
  - `MatchResultSubmissionSchema` validation: Minimum 1 team row, valid placements (1–32), non-negative kills.
  - Match score input validator (`validateMatchScoreInputs`):
    - Rejects duplicate placement ranks (e.g. two squads placed 1st).
    - Rejects duplicate team entries in the same match.
    - Rejects negative kill counts.
    - Emits warnings on unusually high kills (>60) or fewer teams than standard lobby capacity.
  - Result sorting: Ensures calculated score entries are returned strictly sorted by placement rank.

### 4.9. Penalties Domain
- **Files**: `tests/penalties-disputes.test.ts`, `scripts/test-runner.ts`
- **Scope**:
  - `PenaltyCreateSchema` validation: Team ID, positive points deduction (`pointsDeducted > 0`), reason min 3 chars, evidence URL.
  - Leaderboard deduction: Active penalties reduce cumulative standings net score.
  - Inactive / VOIDED penalty immunity: Penalties with status `VOIDED` are ignored during leaderboard calculations.
  - Floor guard: Net team score cannot fall below 0 even if penalty points exceed accumulated points.

### 4.10. Disputes Domain
- **Files**: `tests/penalties-disputes.test.ts`, `scripts/test-runner.ts`
- **Scope**:
  - `DisputeCreateSchema` validation: Category (`SCORING`, `ROSTER`, `BEHAVIOR`, `TECHNICAL`), description min 5 chars, evidence URL.
  - Adjudication lifecycle: `OPEN` ➔ `UNDER_REVIEW` ➔ `ACCEPTED` / `REJECTED` ➔ `RESOLVED`.
  - Finalization audit blocking: Open disputes immediately fail the tournament pre-flight finalization audit.

### 4.11. End-to-End Operational Lifecycle Workflow
- **Files**: `tests/e2e-workflow.test.ts`, `scripts/test-runner.ts`
- **Scope**:
  - Complete 14-step integration test validating the entire tournament director journey:
    1. Tournament Configuration Creation (BGIS preset).
    2. Squad & Player Roster Onboarding (16 squads).
    3. Seeded Group Distribution (4 balanced groups).
    4. Group Locking & State Transition (`CHECK_IN` ➔ `GROUPS_LOCKED`).
    5. Conflict-Free Timetable Generation (4 rotating matches).
    6. Scheduling Collision Audit (0 conflicts).
    7. Room Credential Generation & RBAC Masking Guard.
    8. Squad Attendance Check-In (`PRESENT`).
    9. Match State Advancement to `LIVE`.
    10. 16-Row Tabular Score Sheet Entry & Submission.
    11. Two-Tier Result Verification & Publication (`SUBMITTED` ➔ `VERIFIED` ➔ `PUBLISHED`).
    12. Live Leaderboard Calculation & WWCD Bonus Verification.
    13. Administrative Rule Violation Penalty & Standings Recalculation.
    14. Dispute Adjudication, Pre-Flight Audit Verification, and Tournament Finalization Lock (`COMPLETED`).

---

## 5. Pre-Flight Finalization Checklist Specification

Before an organizer can transition a tournament from `RESULTS_REVIEW` to `COMPLETED`, the engine executes an authoritative pre-flight audit (`auditTournamentFinalization`):

| Check ID | Verification Rule | Failure Impact |
|---|---|---|
| `matches_complete` | $100\%$ of scheduled matches must have operational status `COMPLETED` or `PUBLISHED`. | Finalization Blocked |
| `results_verified` | $100\%$ of match result sheets must have result status `VERIFIED` or `PUBLISHED`. | Finalization Blocked |
| `disputes_resolved` | `openDisputesCount === 0`. All protest tickets must be marked `RESOLVED`, `ACCEPTED`, or `REJECTED`. | Finalization Blocked |
| `active_teams` | Participating active team count must be $\ge 2$. | Finalization Blocked |
| `penalties_confirmed` | (Optional extended) Zero pending unconfirmed penalties. | Finalization Blocked |
| `tiebreakers_resolved` | (Optional extended) Zero unresolved standing rank collisions. | Finalization Blocked |

---

## 6. Test Suite Directory Structure

```
tests/
├── scoring.test.ts               (Exhaustive scoring engine & tie-breaker tests)
├── tournament.test.ts            (Tournament engine, groups, & schedule conflict tests)
├── tournament-lifecycle.test.ts  (State machines, transition guards, & pre-flight checklist)
├── teams-rosters.test.ts         (Team/Player schemas & CSV roster export formatter)
├── groups-seeding.test.ts        (Group distribution math, deterministic PRNG, & lock guards)
├── matches-scheduling.test.ts    (Timetable generation, map rotation, & match state machine)
├── rooms-attendance.test.ts      (Room double-booking, credentials schema, & RBAC masking)
├── results-lifecycle.test.ts     (Score input validation, submission schema, & sorting)
├── penalties-disputes.test.ts    (Penalty deductions, voiding, floor at 0, & dispute blocking)
└── e2e-workflow.test.ts          (Complete 14-step end-to-end tournament operational lifecycle)

scripts/
├── test-runner.ts                (Fast, standalone esbuild-bundled master test runner)
└── verify-api.mjs                (Live HTTP integration verification script against running server)
```

---

## 7. Continuous Integration & Quality Gates

In the CI/CD pipeline, the following quality gates must pass on every pull request:

1. **Compilation Check**: `npx tsc --noEmit` exits with code 0 (zero TypeScript errors).
2. **Fast Test Suite**: `npm test` executes the bundled test runner across all 11 domains with 0 failures.
3. **Comprehensive Test Suite**: `npx vitest run` executes all test files in `tests/**` with 100% pass rate.
4. **Code Coverage Threshold**:
   - `lib/scoring/**`: $\ge 95\%$ line coverage
   - `lib/tournament/**`: $\ge 90\%$ line coverage
   - `lib/validation/**`: $\ge 90\%$ line coverage
