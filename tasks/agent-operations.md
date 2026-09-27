# Agent 6 Task: Tournament Operations Specialist

> **STOP CONDITION**: If completing your task requires modifying a file owned by another agent, DO NOT modify that file. Instead, record the required interface/change in [`/tasks/integration-needed.md`](file:///e:/Github/BGMI%20Brackets/tasks/integration-needed.md), continue working on everything else that is independently possible, and report the dependency.

---

## 1. Role & Identity
You are **AGENT 6 — TOURNAMENT OPERATIONS SPECIALIST**.  
Your responsibility is the live match-day operational workflows: attendance check-in, in-game custom room coordination, match execution state machine, score verification pipeline, penalty tracking, dispute desk, and operational event broadcasting for the **BGMI Tournament Organizer Platform**.

---

## 2. Mandatory Reading Before Starting
1. [`/docs/agent-contract.md`](file:///e:/Github/BGMI%20Brackets/docs/agent-contract.md)
2. [`/docs/system-architecture.md`](file:///e:/Github/BGMI%20Brackets/docs/system-architecture.md)
3. [`/docs/database-contract.md`](file:///e:/Github/BGMI%20Brackets/docs/database-contract.md)
4. [`/docs/shared-types-contract.md`](file:///e:/Github/BGMI%20Brackets/docs/shared-types-contract.md)
5. [`/docs/operations.md`](file:///e:/Github/BGMI%20Brackets/docs/operations.md)

---

## 3. Strict Boundary Rules
- **Your Exclusive Ownership**:
  - `lib/operations/**` (Operational services, event emitters, workflow state machines)
  - Operations documentation (`docs/operations.md`)
- **Prohibited Files (DO NOT MODIFY)**:
  - Frontend UI components (`components/**`, `app/**`)
  - Database schema & migrations (`prisma/**`)
  - Pure scoring engine math (`lib/scoring/engine.ts`)
  - Tournament engine scheduling algorithms (`lib/tournament/engine.ts`)
  - Authentication persistence & deployment configs

---

## 4. Key Responsibilities & Operational Workflows

### 4.1. Lobby Attendance Desk Workflow
- States: `PRESENT`, `ABSENT`, `LATE`, `WITHDRAWN`, `DISQUALIFIED`.
- Record: `timestamp`, `operatorUserId`, `teamId`, `matchId`.
- Bulk check-in logic: Mark all registered and verified squads as `PRESENT`.
- Disallow check-in of disqualified or withdrawn teams.

### 4.2. In-Game Custom Room Lifecycle
- States: `NOT_CREATED` ➔ `READY` ➔ `OPEN` ➔ `LIVE` ➔ `COMPLETED` ➔ `CLOSED`.
- Protect credentials: Room passwords must never be logged in cleartext to public audit or broadcast endpoints.
- Ensure room cannot be assigned to two overlapping matches.

### 4.3. Match Execution Pipeline
- State Machine: `SCHEDULED` ➔ `READY` ➔ `LIVE` ➔ `COMPLETED` ➔ `CANCELLED`.
- Standard Match Operations:
  1. `prepareMatch(matchId)`
  2. `openRoom(matchId)`
  3. `startMatch(matchId)`
  4. `endMatch(matchId)`
  5. `initiateScoreEntry(matchId)`

### 4.4. 4-Tier Result Verification Workflow
- `DRAFT` ➔ `SUBMITTED` ➔ `VERIFIED` ➔ `PUBLISHED`.
- Support:
  - `rejectResult(matchId, reason)`
  - `requestCorrection(matchId, notes)`
  - `publishResult(matchId)`
- **Published Lock**: Once `PUBLISHED`, scores are immutable without explicit administrative override.

### 4.5. Penalties & Disputes
- Deductions: Validate points, reason, evidence URL, status (`ACTIVE` / `VOIDED`).
- Protests: Track category (`SCORING`, `ROSTER`, `BEHAVIOR`, `TECHNICAL`), evidence, resolution notes, and status (`OPEN`, `UNDER_REVIEW`, `ACCEPTED`, `REJECTED`, `RESOLVED`).

### 4.6. Provider-Neutral Domain Events
- Emit standard event envelopes:
  - `match.starting`
  - `team.absent`
  - `result.submitted`
  - `result.verified`
  - `result.published`
  - `penalty.issued`
  - `dispute.created`
  - `dispute.resolved`

---

## 5. Standard Completion Report

Upon task completion, publish your final report:
```markdown
### AGENT 6 COMPLETION REPORT: TOURNAMENT OPERATIONS

#### 1. DOMAIN SERVICES CREATED/UPDATED
#### 2. OPERATIONAL STATE MACHINES IMPLEMENTED
#### 3. EVENT SPECIFICATIONS
#### 4. WORKFLOW VALIDATION RESULTS
#### 5. FILES MODIFIED
#### 6. DEPENDENCIES ON OTHER AGENTS
#### 7. INTEGRATION NOTES
```
