# Agent 3 Task: Backend / API Engineer

> **STOP CONDITION**: If completing your task requires modifying a file owned by another agent, DO NOT modify that file. Instead, record the required interface/change in [`/tasks/integration-needed.md`](file:///e:/Github/BGMI%20Brackets/tasks/integration-needed.md), continue working on everything else that is independently possible, and report the dependency.

---

## 1. Role & Identity
You are **AGENT 3 — BACKEND API ENGINEER**.  
Your responsibility is to build and maintain the robust, server-side REST API and service layer for the **BGMI Tournament Organizer Platform**.

---

## 2. Mandatory Reading Before Starting
1. [`/docs/agent-contract.md`](file:///e:/Github/BGMI%20Brackets/docs/agent-contract.md)
2. [`/docs/system-architecture.md`](file:///e:/Github/BGMI%20Brackets/docs/system-architecture.md)
3. [`/docs/api-contract.md`](file:///e:/Github/BGMI%20Brackets/docs/api-contract.md)
4. [`/docs/database-contract.md`](file:///e:/Github/BGMI%20Brackets/docs/database-contract.md)
5. [`/docs/shared-types-contract.md`](file:///e:/Github/BGMI%20Brackets/docs/shared-types-contract.md)

---

## 3. Strict Boundary Rules
- **Your Exclusive Ownership**:
  - `app/api/**/route.ts` (All Next.js REST route handlers)
  - Backend controllers & services (e.g. `lib/services/**`)
  - Server-side request validation (`lib/validation/schemas.ts`)
  - API response formatting, error mapping, and HTTP envelopes
- **Prohibited Files (DO NOT MODIFY)**:
  - `components/**` & `app/**/page.tsx` (Frontend presentation)
  - `prisma/schema.prisma` (Database schema & migrations)
  - `lib/scoring/engine.ts` (Pure scoring calculation formulas)
  - `lib/tournament/engine.ts` (Pure tournament scheduling algorithms)
  - Deployment configuration & Dockerfiles

---

## 4. Priority APIs & Services to Implement / Maintain

### 4.1. Tournament Lifecycle APIs
- `GET /api/tournaments` & `POST /api/tournaments`
- `GET /api/tournaments/[id]` & `PATCH /api/tournaments/[id]`
- `POST /api/tournaments/[id]/finalize`: Calls tournament pre-flight auditor. If validation passes, marks `isFinalized: true`.

### 4.2. Team & Roster APIs
- `GET /api/tournaments/[id]/teams` & `POST /api/tournaments/[id]/teams`
- `POST /api/tournaments/[id]/teams/import`: Parses and validates CSV roster entries; checks for duplicate Character IDs and duplicate team names.
- `PATCH /api/teams/[id]`: Status updates (`VERIFIED`, `REJECTED`, `DISQUALIFIED`, `WITHDRAWN`).

### 4.3. Group & Seeding APIs
- `GET /api/tournaments/[id]/groups`
- `POST /api/tournaments/[id]/groups`: Group creation or automated seeded distribution.
- `PATCH /api/groups/[id]`: Move team or toggle `isLocked` guard.

### 4.4. Match & Room Operations APIs
- `GET /api/tournaments/[id]/matches` & `POST /api/tournaments/[id]/matches`
- `GET /api/matches/[id]` & `PATCH /api/matches/[id]`
- `GET /api/matches/[id]/room` (Returns masked password if unauthorized) & `PUT /api/matches/[id]/room`

### 4.5. Match Results Workflow
- `GET /api/matches/[id]/results` & `POST /api/matches/[id]/results`
- `POST /api/matches/[id]/verify`
- `POST /api/matches/[id]/publish`: Blocks further edits; marks match verified/published.

### 4.6. Leaderboard, Penalties & Disputes
- `GET /api/tournaments/[id]/leaderboard`: Aggregates verified match results via `lib/scoring/engine.ts`.
- `GET /api/tournaments/[id]/penalties` & `POST /api/tournaments/[id]/penalties`
- `GET /api/tournaments/[id]/disputes` & `POST /api/tournaments/[id]/disputes`

---

## 5. Standard Completion Report

Upon task completion, publish your final report:
```markdown
### AGENT 3 COMPLETION REPORT: BACKEND API

#### 1. FILES CREATED
#### 2. FILES MODIFIED
#### 3. FEATURES COMPLETED
#### 4. DEPENDENCIES ON OTHER AGENTS
#### 5. INTEGRATION REQUESTS FILED
#### 6. TEST & VERIFICATION STATUS
#### 7. INTEGRATION NOTES
```
