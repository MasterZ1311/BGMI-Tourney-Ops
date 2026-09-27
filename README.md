# BGMI Tournament Control Center (BGMI TCC)

> **"Plan. Run. Score. Finalize."**  
> The production-ready esports operations dashboard engineered specifically for Battlegrounds Mobile India (BGMI) tournament directors, head admins, lobby marshals, and scorekeepers.

---

## 1. Product Overview

Running a BGMI tournament is radically different from traditional 1v1 tactical shooter brackets (such as Valorant or CS2). Battlegrounds Mobile India drops **16 to 25+ squads simultaneously** into a single battle royale lobby across Erangel, Miramar, Sanhok, and Vikendi. 

**BGMI TCC** is an **internal organizer control center** designed to eliminate spreadsheet mistakes, streamline high-pressure match-day operations, and provide an authoritative single source of truth for tournament lifecycle management.

---

## 2. Key Features

- **7-Step Guided Tournament Wizard**:
  - Basic Details (Name, Organizer, Dates, Hybrid/LAN Venue)
  - Tournament Formats (Single Stage, Group Stage, Groups + Finals, Qualifiers + Finals, Custom)
  - Squad Limits (Roster cap, Squad size 4, Substitutes cap 2, Max teams per lobby)
  - Timetable (Match counts, Maps rotation, Duration, Breaks)
  - Configurable Scoring Presets (Official BGIS 10-Point, BMPS 15-Point, Classic PMCO 20-Point, or Custom multipliers)
  - Tournament Integrity Policies (No-show grace periods, Dispute protest windows, Emulator bans)
  - Pre-flight review and instant launch

- **Squad & Player Roster Management**:
  - Full squad profiles with team tags, logos, captain designations, and starting lineups.
  - Mandatory BGMI Character IDs (numeric UIDs) and In-Game Names (IGNs).
  - Bench player substitute tracking and swap controls.
  - Team verification toggle and disqualification/withdrawal actions.

- **Bulk CSV / Excel Import**:
  - Fast squad onboarding with automatic column mapping.
  - Pre-validation preview catching duplicate UIDs, duplicate team names, and missing squad members before commit.
  - Ready-to-use downloadable sample CSV template.

- **Dedicated 1-Click Lobby Check-In Desk**:
  - High-speed attendance tracking: `Present`, `Late`, `Absent`, `Disqualified`.
  - Bulk *"Mark All Verified as Present"* action.
  - Filter by group, search by squad, with staff attribution timestamps.

- **Group Management & Seeded Randomizer**:
  - Multi-group allocation (Group A, Group B, Group C, etc.).
  - Deterministic pseudo-random seeded shuffle for balanced group distribution.
  - Group Lock guard to prevent accidental reshuffling on match day.

- **Match Scheduler & Conflict Detection**:
  - Automated timetable generator with Erangel, Miramar, Sanhok, and Vikendi rotations.
  - Concurrency checks preventing room double-booking or team scheduling collisions.

- **BGMI Custom Room Operations Hub**:
  - Custom Room ID and Password management.
  - 1-click copy formatted credentials for team captains.
  - Concealed passwords on public views for broadcast security.
  - Room status tracking (`Not Created` -> `Ready` -> `Open` -> `Live` -> `Completed` -> `Closed`).

- **Match Operations Command Center**:
  - Single-screen operations: `[Open Room]`, `[Start Match]`, `[Mark Live]`, `[End Match]`, `[Enter Results]`.
  - No navigating back and forth across different screens during match-day pressure.

- **60-Second Fast Score Entry Grid**:
  - 16-row tabular layout sorted by rank 1-16.
  - Instant squad search dropdown.
  - Kills numeric input with live auto-calculation of Kill Points, Placement Points, and Net Totals.
  - Built-in validation guarding against duplicate ranks or negative kills.
  - 4-Tier Verification State Machine: `DRAFT` -> `SUBMITTED` -> `VERIFIED` -> `PUBLISHED`.

- **Pure Mathematical Scoring Engine**:
  - Completely decoupled, side-effect-free calculation engine (`lib/scoring/engine.ts`).
  - Presets: Official BGIS 10-Point (10, 6, 5, 4, 3, 2, 1, 1, 0...), BMPS 15-Point (15, 12, 10, 8, 6, 4, 2, 1...), PMCO 20-Point.
  - Configurable prioritized tie-breakers:
    1. Total WWCDs (Wins)
    2. Total Placement Points
    3. Total Kill Points
    4. Highest Single-Match Score
    5. Most Recent Match Placement

- **Live Authoritative Leaderboard**:
  - Aggregated dynamically from verified match score sheets.
  - Overall, Group, and single-match breakdowns.
  - Chicken Dinner (🍗) win badges and net score metrics.
  - Export to CSV and clean printable format.

- **Penalty Ledger & Dispute Desk**:
  - Negative point deductions with rulebook violation attribution.
  - Void penalty action with full audit logging.
  - Team protest adjudication desk (`Open`, `Under Review`, `Accepted`, `Rejected`, `Resolved`).

- **Pre-Flight Tournament Finalization Guard**:
  - Automated checklist audit:
    - 100% of matches completed
    - 100% of results verified & published
    - 0 unresolved protests or open disputes
    - Active participating teams validated
  - Hard lock preventing post-finalization score tampering.

- **Public Stage & Stream Overlay Mode (`/display`)**:
  - Dedicated full-screen broadcast feed for stage projectors, LED walls, and OBS browser sources.
  - High-contrast dark esports aesthetic with live pulse indicators.
  - Sensitive organizer controls and lobby passwords automatically concealed.

- **Keyboard Shortcuts**:
  - `/` : Focus global search
  - `?` : Open shortcuts modal
  - `M` : Jump to Match Control
  - `L` : Jump to Leaderboard
  - `A` : Jump to Attendance Desk
  - `S` : Jump to Score Entry Grid
  - `Esc` : Close modals

---

## 3. Technology Stack

- **Framework**: Next.js 14+ (App Router, Server & Client Components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Dark-first high-contrast esports theme)
- **Icons**: Lucide Icons
- **Database ORM**: Prisma ORM
- **Database**: SQLite (built-in default for zero-config local runnability), PostgreSQL-compatible
- **Payload Validation**: Zod
- **Testing**: Pure TypeScript test suite + Vitest
- **Data Export**: PapaParse CSV & Native Print Layouts

---

## 4. Quick Start & Installation

### Prerequisites
- Node.js 18+ (tested on Node.js v20 and v22)
- npm or yarn

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd "BGMI Brackets"
npm install
```

### 2. Configure Environment (.env)
The repository includes a ready-to-use `.env` pointing to local SQLite:
```env
DATABASE_URL="file:./dev.db"
PORT=3000
NODE_ENV=development
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_SECRET="bgmi-tournament-super-secret-key-32-chars-long"
```

### 3. Initialize Database Schema
```bash
npx prisma db push
```

### 4. Run Automated Test Suite
```bash
npm test
```
All 13 competition scoring and tournament engine tests execute in under 100ms.

### 5. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Instant Demo Tournament Mode

When launching BGMI TCC:
1. Click **"Load Demo Tournament"** in the top navigation header.
2. The platform instantly seeds the **"BGMI Pro Invitational 2026"**:
   - 16 Tier-1 BGMI Squads (Team SouL, GodLike, Team XSpark, Global Esports, Carnival Gaming, Revenant, Entity, Gods Reign, Orangutan, Reckoning, Medal, Gujarat Tigers, Blind, 8Bit, Hydra, Team Forever)
   - 4 scheduled matches with live map rotation
   - 2 verified completed matches with authentic score distributions
   - 1 live match (Match #3 - Sanhok) with active Room ID and Password
   - Full lobby attendance records
   - Active penalty and protest dispute records
   - Live aggregated leaderboard ready for inspection
3. You can click **"Reset Demo Data"** at any time to return the database to initial match-day state.

---

## 6. End-to-End Tournament Organizer Workflow

```
CREATE TOURNAMENT (Wizard)
       ↓
CONFIGURE RULES (BGIS 10-pt or BMPS 15-pt)
       ↓
ADD / BULK IMPORT SQUADS (CSV with Player UIDs)
       ↓
VERIFY ROSTERS
       ↓
CREATE & RANDOMIZE GROUPS (Deterministic Seed)
       ↓
LOCK GROUPS
       ↓
GENERATE MATCH SCHEDULE (Map Rotation)
       ↓
DISPATCH ROOM CREDENTIALS (1-Click Copy ID & Pass)
       ↓
CHECK IN ATTENDANCE (Rapid 1-Click Present/Late/Absent)
       ↓
RUN MATCH (Scheduled -> Ready -> Open -> Live -> Completed)
       ↓
ENTER RESULTS (16-Row High Speed Grid)
       ↓
VERIFY & PUBLISH SCORES (Admin Workflow)
       ↓
LEADERBOARD UPDATES DYNAMICALLY (Auto Tie-Breakers)
       ↓
APPLY PENALTIES & RESOLVE PROTESTS
       ↓
COMPLETE ALL MATCHES
       ↓
RUN PRE-FLIGHT AUDIT & FINALIZE TOURNAMENT
       ↓
EXPORT STANDINGS & ROSTERS (CSV & Print)
```

---

## 7. Documentation Index

- [`/docs/architecture.md`](file:///e:/Github/BGMI%20Brackets/docs/architecture.md) — Comprehensive technical architecture
- [`/docs/product-requirements.md`](file:///e:/Github/BGMI%20Brackets/docs/product-requirements.md) — PRD & user stories
- [`/docs/database-schema.md`](file:///e:/Github/BGMI%20Brackets/docs/database-schema.md) — Database models & entity relationships
- [`/docs/api-spec.md`](file:///e:/Github/BGMI%20Brackets/docs/api-spec.md) — Complete REST API specification
- [`/docs/scoring-engine.md`](file:///e:/Github/BGMI%20Brackets/docs/scoring-engine.md) — Scoring mathematics & tie-breaker trees
- [`/docs/tournament-engine.md`](file:///e:/Github/BGMI%20Brackets/docs/tournament-engine.md) — State machines & conflict validation
- [`/docs/ui-architecture.md`](file:///e:/Github/BGMI%20Brackets/docs/ui-architecture.md) — Design system & UI specifications
- [`/docs/agent-coordination.md`](file:///e:/Github/BGMI%20Brackets/docs/agent-coordination.md) — Multi-agent development protocol
- [`/docs/testing-strategy.md`](file:///e:/Github/BGMI%20Brackets/docs/testing-strategy.md) — Test pyramid & scoring verification
- [`/docs/deployment.md`](file:///e:/Github/BGMI%20Brackets/docs/deployment.md) — Deployment & production environment setup
- [`/docs/ux.md`](file:///e:/Github/BGMI%20Brackets/docs/ux.md) — UX workflows & match-day design decisions
- [`/docs/security.md`](file:///e:/Github/BGMI%20Brackets/docs/security.md) — Security threat model & RBAC matrix
- [`/docs/user-guide.md`](file:///e:/Github/BGMI%20Brackets/docs/user-guide.md) — Complete operational guide for organizers
- [`/tasks/task-board.md`](file:///e:/Github/BGMI%20Brackets/tasks/task-board.md) — Development execution board

---

## 8. License

Internal Tournament Operations Software. Proprietary & Confidential. Designed for BGMI Esports Organizers.
