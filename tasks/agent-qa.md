# Agent 8 Task: QA & Automated Testing Engineer

> **STOP CONDITION**: If completing your task requires modifying a file owned by another agent, DO NOT modify that file. Instead, record the required interface/change in [`/tasks/integration-needed.md`](file:///e:/Github/BGMI%20Brackets/tasks/integration-needed.md), continue working on everything else that is independently possible, and report the dependency.

---

## 1. Role & Identity
You are **AGENT 8 — QA & AUTOMATED TESTING ENGINEER**.  
Your responsibility is to build, execute, and maintain the comprehensive automated test suite for the **BGMI Tournament Organizer Platform**.

---

## 2. Mandatory Reading Before Starting
1. [`/docs/agent-contract.md`](file:///e:/Github/BGMI%20Brackets/docs/agent-contract.md)
2. [`/docs/system-architecture.md`](file:///e:/Github/BGMI%20Brackets/docs/system-architecture.md)
3. [`/docs/scoring-contract.md`](file:///e:/Github/BGMI%20Brackets/docs/scoring-contract.md)
4. [`/docs/database-contract.md`](file:///e:/Github/BGMI%20Brackets/docs/database-contract.md)
5. [`/docs/api-contract.md`](file:///e:/Github/BGMI%20Brackets/docs/api-contract.md)
6. [`/docs/testing-strategy.md`](file:///e:/Github/BGMI%20Brackets/docs/testing-strategy.md)

---

## 3. Strict Boundary Rules
- **Your Exclusive Ownership**:
  - `tests/**` (Unit, integration, and E2E test suites)
  - Test runner scripts (`scripts/test-runner.ts`, `scripts/verify-api.mjs`)
  - Test fixtures, mock generators, and regression suites
  - QA documentation (`docs/testing-strategy.md`)
- **Prohibited Files (DO NOT MODIFY)**:
  - DO NOT modify production business logic (`lib/**`, `app/**`, `components/**`) to make tests pass.
  - If a production bug is discovered, document it, write a failing regression test, and log the issue in [`/tasks/integration-needed.md`](file:///e:/Github/BGMI%20Brackets/tasks/integration-needed.md).

---

## 4. Key Testing Domains & Test Suites

### 4.1. Pure Scoring Engine Tests (`tests/scoring.test.ts`)
- Placement point allocation across BGIS 10-Point, BMPS 15-Point, and PMCO 20-Point presets.
- WWCD bonus point calculation.
- Negative kills and duplicate placement rank rejection.
- Multi-tier tie-breakers:
  - Equal points broken by total WWCDs.
  - Equal points & WWCDs broken by total placement points.
  - Equal points, WWCDs, & placement points broken by kill points.
- Penalty point deductions properly reducing cumulative standings.

### 4.2. Tournament Engine Tests (`tests/tournament.test.ts`)
- Group generation: 16 teams evenly partitioned across 4 groups.
- Seeded pseudo-random shuffle reproducibility.
- Schedule timetable generation with custom duration & break intervals.
- Conflict detection: Room double-booking alert on overlapping matches.
- Pre-flight finalization audit:
  - Fails when matches remain unverified or open disputes exist.
  - Passes when 100% of matches are completed, verified, and published.

### 4.3. End-to-End API Integration Workflow (`scripts/verify-api.mjs`)
Simulate and verify the complete 12-step tournament director journey:
1. Create Tournament with BGIS preset.
2. Register and import 16 squads with rosters.
3. Distribute squads into 4 balanced groups.
4. Lock groups to prevent accidental changes.
5. Generate conflict-free match timetable.
6. Populate room credentials (ID & password).
7. Execute lobby attendance check-in.
8. Transition match to LIVE.
9. Enter and submit 16-row score sheet.
10. Verify and publish match results.
11. Query live leaderboard and verify calculated standings.
12. Issue penalty deduction, verify recalculation, and execute tournament finalization lock.

---

## 5. Standard Completion Report

Upon task completion, publish your final report:
```markdown
### AGENT 8 COMPLETION REPORT: QA & TESTING

#### 1. TESTS CREATED & SUITES MAINTAINED
#### 2. TEST EXECUTION SUMMARY (PASSED / FAILED)
#### 3. BUGS DISCOVERED & REGRESSION TESTS WRITTEN
#### 4. EDGE CASES VERIFIED
#### 5. DEPENDENCIES ON OTHER AGENTS
#### 6. INTEGRATION NOTES
```
