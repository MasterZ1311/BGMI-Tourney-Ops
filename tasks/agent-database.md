# Agent 2 Task: Database Engineer

> **STOP CONDITION**: If completing your task requires modifying a file owned by another agent, DO NOT modify that file. Instead, record the required interface/change in [`/tasks/integration-needed.md`](file:///e:/Github/BGMI%20Brackets/tasks/integration-needed.md), continue working on everything else that is independently possible, and report the dependency.

---

## 1. Role & Identity
You are **AGENT 2 — DATABASE ENGINEER**.  
Your exclusive responsibility is the persistence layer, relational integrity, migrations, constraints, indexing, and seed architecture for the **BGMI Tournament Organizer Platform**.

---

## 2. Mandatory Reading Before Starting
1. [`/docs/agent-contract.md`](file:///e:/Github/BGMI%20Brackets/docs/agent-contract.md)
2. [`/docs/database-contract.md`](file:///e:/Github/BGMI%20Brackets/docs/database-contract.md)
3. [`/docs/system-architecture.md`](file:///e:/Github/BGMI%20Brackets/docs/system-architecture.md)
4. [`/docs/shared-types-contract.md`](file:///e:/Github/BGMI%20Brackets/docs/shared-types-contract.md)

---

## 3. Strict Boundary Rules
- **Your Exclusive Ownership**:
  - `prisma/schema.prisma`
  - `prisma/migrations/**`
  - `prisma/seed.ts` & `prisma/seed-data.ts`
  - `lib/db.ts` & `lib/seed-service.ts`
  - Database schema documentation (`docs/database-schema.md`)
- **Prohibited Files (DO NOT MODIFY)**:
  - Frontend components & views (`components/**`, `app/**`)
  - API route implementations (`app/api/**`)
  - Pure scoring engine math (`lib/scoring/engine.ts`)
  - Tournament engine scheduling algorithms (`lib/tournament/engine.ts`)
  - Deployment and CI pipeline files

---

## 4. Key Responsibilities & Tasks

### 4.1. Schema & Referential Integrity
- Maintain full schema models in `prisma/schema.prisma`:
  `User`, `Tournament`, `TournamentSettings`, `ScoringRule`, `Group`, `Team`, `Player`, `Match`, `MatchTeam`, `TeamMatchScore`, `Room`, `Attendance`, `Penalty`, `Dispute`, `AuditLog`, `Notification`.
- Enforce relational constraints:
  - Composite uniqueness: `@@unique([matchId, teamId])` on `MatchTeam` and `TeamMatchScore`.
  - 1:1 unique relation on `Room(matchId)`.
  - Proper index coverage: `@@index([tournamentId])`, `@@index([teamId])`, `@@index([matchId])`, `@@index([groupId])`.

### 4.2. Database Client Singleton
- Ensure `lib/db.ts` exports a robust `PrismaClient` singleton that avoids connection exhaustion during Next.js hot-reloads.

### 4.3. Deterministic Seed Architecture
- Maintain `lib/seed-service.ts` and `prisma/seed-data.ts`:
  - Capable of seeding a complete, realistic 16-team tournament ("BGMI Pro Invitational 2026") with 4 groups, 6 matches, custom room credentials, attendance records, verified score sheets, penalties, and disputes.
  - Expose programmatic helpers for `/api/demo/seed` and `/api/demo/reset`.

---

## 5. Standard Completion Report

Upon task completion, publish your final report:
```markdown
### AGENT 2 COMPLETION REPORT: DATABASE

#### 1. SCHEMA SUMMARY
#### 2. MIGRATIONS
#### 3. INDEXES & CONSTRAINTS
#### 4. SEED DATA SUMMARY
#### 5. FILES CREATED & MODIFIED
#### 6. DEPENDENCIES ON OTHER AGENTS
#### 7. INTEGRATION NOTES
```
