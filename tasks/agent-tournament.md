# Agent 5 Task: Tournament Engine Specialist

> **STOP CONDITION**: If completing your task requires modifying a file owned by another agent, DO NOT modify that file. Instead, record the required interface/change in [`/tasks/integration-needed.md`](file:///e:/Github/BGMI%20Brackets/tasks/integration-needed.md), continue working on everything else that is independently possible, and report the dependency.

---

## 1. Role & Identity
You are **AGENT 5 — TOURNAMENT ENGINE SPECIALIST**.  
Your responsibility is to build and maintain the tournament domain algorithms, group balancing logic, conflict-free match scheduling, state transitions, and pre-flight finalization audit checks for the **BGMI Tournament Control Center**.

---

## 2. Mandatory Reading Before Starting
1. [`/docs/agent-contract.md`](file:///e:/Github/BGMI%20Brackets/docs/agent-contract.md)
2. [`/docs/system-architecture.md`](file:///e:/Github/BGMI%20Brackets/docs/system-architecture.md)
3. [`/docs/shared-types-contract.md`](file:///e:/Github/BGMI%20Brackets/docs/shared-types-contract.md)
4. [`/docs/tournament-engine.md`](file:///e:/Github/BGMI%20Brackets/docs/tournament-engine.md)

---

## 3. Strict Boundary Rules
- **Your Exclusive Ownership**:
  - `lib/tournament/engine.ts`
  - `lib/tournament/types.ts`
  - `tests/tournament.test.ts`
  - `docs/tournament-engine.md`
- **Prohibited Files (DO NOT MODIFY)**:
  - Frontend components (`components/**`, `app/**`)
  - Database schema (`prisma/schema.prisma`)
  - Core scoring calculation math (`lib/scoring/engine.ts`)
  - API route implementations (`app/api/**`)
  - Authentication & security files

---

## 4. Key Responsibilities & Tasks

### 4.1. Seeded Group Generation & Balancing
- `generateBalancedGroups(options: GroupGenerationOptions): Array<{ name: string; teamIds: string[] }>`
  - Evenly distributes squads across requested group counts.
  - Supports deterministic seeded pseudo-random shuffle (e.g. `seed = 42`) for repeatable distribution.
  - Respects `isLocked` guard: locked groups cannot be reshuffled.

### 4.2. Conflict-Free Match Scheduling
- `generateScheduleSlots(options: ScheduleGenerationOptions): GeneratedMatchSlot[]`
  - Generates time slots taking `matchDurationMinutes` and `breakDurationMinutes`.
  - Rotates maps automatically: Erangel ➔ Miramar ➔ Sanhok ➔ Vikendi.
- `detectSchedulingConflicts(matches: MatchEntity[]): ConflictCheckResult`
  - Guards against:
    - Same team playing in overlapping matches.
    - Same room assigned to overlapping concurrent matches.
    - Match start time in the past or invalid ranges.

### 4.3. Tournament State Machine
- Validates transitions across:
  `DRAFT` ➔ `REGISTRATION` ➔ `CHECK_IN` ➔ `GROUPS_LOCKED` ➔ `SCHEDULED` ➔ `LIVE` ➔ `RESULTS_REVIEW` ➔ `COMPLETED` ➔ `ARCHIVED`.
- Disallows illegal status jumps.

### 4.4. Pre-Flight Finalization Audit
- `auditTournamentFinalization(tournamentId: string, context: FinalizationContext): FinalizationAuditResult`
  - Validates:
    - 100% of matches completed.
    - 100% of results verified & published.
    - 0 open protests or unresolved disputes.
    - All penalties confirmed.
    - Standings tie-breakers fully resolved.
  - Returns `{ canFinalize: boolean, checklist: FinalizationCheckItem[] }`.

---

## 5. Standard Completion Report

Upon task completion, publish your final report:
```markdown
### AGENT 5 COMPLETION REPORT: TOURNAMENT ENGINE

#### 1. ALGORITHMS & SERVICES
#### 2. STATE MACHINE TRANSITIONS VERIFIED
#### 3. CONFLICT DETECTION RULES TESTED
#### 4. FINALIZATION AUDIT RULES
#### 5. FILES MODIFIED
#### 6. DEPENDENCIES ON OTHER AGENTS
#### 7. INTEGRATION NOTES
```
