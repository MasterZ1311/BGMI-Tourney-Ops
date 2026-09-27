# BGMI Tournament Organizer Platform — UI / Frontend Contract

## 1. Owner & Scope

- **Exclusive Agent Owner**: **Agent 1 (Frontend & UI Engineer)**
- **Owned Paths**:
  - `app/**/page.tsx`, `app/**/layout.tsx`
  - `components/**`
  - `tailwind.config.js`, global CSS files
  - UI state hooks and client-side utilities
  - `docs/ui-architecture.md`
- **Prohibited Modifications**:
  - Database schema & migrations (`prisma/**`)
  - Backend API implementations (`app/api/**`)
  - Pure scoring engine math (`lib/scoring/engine.ts`)
  - Tournament engine scheduling logic (`lib/tournament/engine.ts`)
  - Auth token/session persistence & deployment files

> ### 🛑 STOP CONDITION
> If completing your task requires modifying a file owned by another agent, DO NOT modify that file. Instead, record the required interface/change in [`/tasks/integration-needed.md`](file:///e:/Github/BGMI%20Brackets/tasks/integration-needed.md), continue working on everything else that is independently possible, and report the dependency.

---

## 2. Design Philosophy: High-Contrast Esports Operations

1. **Dark-First Esports Aesthetic**:
   - Backgrounds: Deep asphalt and charcoal (`#090d16`, `#0f172a`, `#1e293b`).
   - Accents: BGMI Amber/Gold (`#f59e0b`), Esports Emerald (`#10b981`), Cyber Cyan (`#06b6d4`), Alert Crimson (`#ef4444`).
   - Typography: Clean monospace numerals for points/kills (`font-mono`), legible sans-serif for UI labels.
2. **Dense Information Hierarchy**:
   - Zero spreadsheet-fatigue. High-density data tables optimized for quick scanning.
   - Avoid oversized cards, generic admin bloat, and decorative whitespace on tournament-day screens.
3. **Keyboard-First Match-Day Operations**:
   - Lobby marshals and scorekeepers operate under strict time limits between matches (often < 5 minutes).
   - Score entry grid must support tab/arrow key navigation, inline row updates, instant validation feedback, and `Ctrl+S` / `Cmd+S` quick save.
4. **Resilient UI States**:
   - Every view must provide explicit Loading, Empty, and Error states.

---

## 3. High-Priority Operational Screens

The frontend is centered around 5 mission-critical operational screens:

### 3.1. Overview Command Center (`components/dashboard/OverviewDashboard.tsx`)
- Active match status banner with real-time room credentials.
- 1-click room password reveal/copy for WhatsApp/Discord transmission.
- Quick stats: Teams verified, Attendance rate, Matches completed, Active disputes.
- Mini-leaderboard preview.

### 3.2. Lobby Attendance Desk (`components/attendance/AttendanceView.tsx`)
- High-speed check-in table for all 16–25 squads.
- 1-click status toggles: `Present`, `Late`, `Absent`, `Disqualified`.
- Global action: *"Mark All Verified Teams Present"*.
- Search by squad name or captain UID.

### 3.3. Match Control Operations (`components/match/MatchControlView.tsx`)
- Linear match control pipeline:
  `[Open Room]` ➔ `[Send Credentials]` ➔ `[Start Match]` ➔ `[Mark Live]` ➔ `[End Match]` ➔ `[Enter Scores]`.
- Conflict alerts if assigned room is occupied.

### 3.4. 60-Second Fast Score Entry Grid (`components/match/FastScoreEntryGrid.tsx`)
- 16-row tabular input layout matching lobby slots 1 to 16.
- Squad selector with autocomplete.
- Tabular numeric input for Kills.
- Live client-side visual preview of placement + kill points based on rule presets.
- Real-time duplicate placement rank prevention.
- Result submission status: `DRAFT` -> `SUBMITTED` -> `VERIFIED` -> `PUBLISHED`.

### 3.5. Live Authoritative Leaderboard (`components/leaderboard/LeaderboardView.tsx`)
- Tabbed breakdowns: Overall Standings, Group Breakdown, Single-Match Scorecards.
- Chicken Dinner (`🍗 WWCD`) visual badges.
- Tie-breaker indicator chips showing why a team holds a specific tie-breaker rank.
- One-click CSV export and clean print layout.

---

## 4. Reusable Component Catalog

All components in `components/shared/` and domain folders must be modular and fully typed:

| Component | Responsibility |
|---|---|
| `StatusBadge` | Renders color-coded status badges for matches, verification, and check-in. |
| `StatCard` | Esports KPI metric card with icon, delta, and subtitle. |
| `Header` | Top app header with tournament selector, live search (`Ctrl+K`), shortcuts (`?`), and user role. |
| `TournamentSubNav` | Secondary tab bar for tournament subviews with active indicator. |
| `QuickSearchModal` | Modal palette for instantly navigating squads, matches, and rooms. |
| `ShortcutsModal` | Keyboard shortcut help desk for rapid match operations. |
| `BulkImportModal` | CSV upload modal with column mapping and pre-commit error table. |

---

## 5. UI Boundary & Scoring Calculation Policy

> **CRITICAL RULE**: Frontend components must NEVER perform proprietary scoring calculation math as authoritative truth.  
> The UI may display immediate visual helpers using shared formulas from `lib/scoring/types.ts`, but all permanent standings, tie-breaks, and leaderboard scores must be fetched from `/api/tournaments/[id]/leaderboard` and authoritative backend endpoints.
