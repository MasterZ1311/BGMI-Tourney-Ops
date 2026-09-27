# Agent 1 Task: Frontend & UI Engineer

> **STOP CONDITION**: If completing your task requires modifying a file owned by another agent, DO NOT modify that file. Instead, record the required interface/change in [`/tasks/integration-needed.md`](file:///e:/Github/BGMI%20Brackets/tasks/integration-needed.md), continue working on everything else that is independently possible, and report the dependency.

---

## 1. Role & Identity
You are **AGENT 1 — FRONTEND & UI ENGINEER**.  
Your responsibility is to build and maintain the complete visual experience and interactive controls for the **BGMI Tournament Control Center (BGMI TCC)**.

---

## 2. Mandatory Reading Before Starting
1. [`/docs/agent-contract.md`](file:///e:/Github/BGMI%20Brackets/docs/agent-contract.md)
2. [`/docs/system-architecture.md`](file:///e:/Github/BGMI%20Brackets/docs/system-architecture.md)
3. [`/docs/ui-contract.md`](file:///e:/Github/BGMI%20Brackets/docs/ui-contract.md)
4. [`/docs/shared-types-contract.md`](file:///e:/Github/BGMI%20Brackets/docs/shared-types-contract.md)

---

## 3. Strict Boundary Rules
- **Your Exclusive Ownership**:
  - `app/**/page.tsx`, `app/**/layout.tsx`
  - `components/**`
  - Frontend hooks, UI state machines, and view helpers
  - UI styling (`tailwind.config.js`, CSS)
  - Loading, empty, and error state presentations
- **Prohibited Files (DO NOT MODIFY)**:
  - `prisma/**` (Database schema & migrations)
  - `app/api/**` (Backend API routes)
  - `lib/scoring/engine.ts` (Pure scoring calculation formulas)
  - `lib/tournament/engine.ts` (Tournament math & scheduler logic)
  - `lib/auth/roles.ts` (Security authorization engine)
  - `tests/**` (QA test infrastructure)

---

## 4. Priority Tasks & Features to Implement / Refine

### 4.1. Core Application Shell & Navigation
- Global header with Tournament Selector, Active Tournament Breadcrumbs, Search (`Ctrl+K`), and Shortcuts (`?`).
- Contextual tournament sub-navigation (`Overview`, `Teams`, `Groups`, `Schedule`, `Rooms`, `Attendance`, `Matches`, `Scores`, `Leaderboard`, `Penalties`, `Disputes`, `Finalize`, `Settings`).

### 4.2. Five Priority Operational Screens
1. **Command Center Dashboard** (`components/dashboard/OverviewDashboard.tsx`):
   - Active match banner with live room credentials.
   - Masked password reveal toggle and 1-click formatted copy button.
   - Rapid status counters (Verified teams, Attendance rate, Completed matches).
2. **Lobby Attendance Desk** (`components/attendance/AttendanceView.tsx`):
   - Fast squad check-in table.
   - Status chips: `Present`, `Late`, `Absent`, `Disqualified`.
   - 1-click *"Mark All Verified Present"* button.
3. **Match Control Panel** (`components/match/MatchControlView.tsx`):
   - Quick match lifecycle trigger buttons: `[Open Room]`, `[Start Match]`, `[Mark Live]`, `[End Match]`, `[Enter Results]`.
4. **60-Second Fast Score Entry Grid** (`components/match/FastScoreEntryGrid.tsx`):
   - 16-row tabular grid with inline squad selector and kills counter.
   - Keyboard navigation (arrows/tab) and instant duplicate-rank visual alert.
   - Status workflow transitions: `DRAFT` -> `SUBMITTED` -> `VERIFIED` -> `PUBLISHED`.
5. **Authoritative Leaderboard** (`components/leaderboard/LeaderboardView.tsx`):
   - Standings table with Chicken Dinner (`🍗 WWCD`) badges and tie-breaker chips.
   - Filter by Group, Overall, and individual match scorecards.
   - 1-click CSV export and printable sheet.

### 4.3. Full Screen Broadcast Stage Overlay
- Verify `/display` page displays dark, high-contrast, broadcast-ready live standings and match status for stream OBS browser sources and arena LED walls.

---

## 5. Standard Completion Report

Upon task completion, publish your final report:
```markdown
### AGENT 1 COMPLETION REPORT: FRONTEND/UI

#### 1. FILES CREATED
#### 2. FILES MODIFIED
#### 3. FEATURES COMPLETED
#### 4. DEPENDENCIES ON OTHER AGENTS
#### 5. INTEGRATION REQUESTS FILED
#### 6. TEST & VERIFICATION STATUS
#### 7. INTEGRATION NOTES
```
