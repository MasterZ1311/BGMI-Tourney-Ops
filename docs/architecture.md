# BGMI Tournament Control Center (BGMI TCC) — Architecture Specification

## 1. System Overview
BGMI Tournament Control Center (BGMI TCC) is an operations-first, low-friction tournament management platform engineered specifically for Battlegrounds Mobile India (BGMI) esports organizers, tournament admins, match admins, and scorekeepers.

Unlike traditional single-elimination or dual-team brackets (e.g. Valorant / CS2 1v1 team formats), BGMI is a battle royale format characterized by:
- 16 to 25+ teams dropping simultaneously into a single lobby/room.
- Multi-dimensional scoring combining match survival (Placement Points) and eliminations (Kill Points), subject to penalties, bonus points, and multi-tier tie-breakers.
- High-pressure tournament-day operations: lobby coordination, room credentials dissemination, check-in, substitutions, rapid score entry, two-tier verification (Scorekeeper -> Tournament Admin), and live leaderboard broadcasting.

## 2. High-Level Architecture Diagram

```
+---------------------------------------------------------------------------------+
|                                 CLIENT TIER                                     |
|  Next.js 14+ App Router / React / Tailwind CSS / Lucide Icons / Recharts        |
|                                                                                 |
|  [Organizer Dashboard]   [Tournament Wizard]   [Squad & Player Manager]         |
|  [Attendance Center]     [Room Ops Center]     [Fast Score Entry Grid]          |
|  [Leaderboard Engine]    [Penalty/Dispute Hub] [Public Stage/Overlay Display]   |
+---------------------------------------------------------------------------------+
                                      |
                                  REST APIs
                                      |
+---------------------------------------------------------------------------------+
|                                 SERVER TIER                                     |
|  Next.js Edge/Node API Route Handlers with Zod Validation & RBAC Middleware     |
|                                                                                 |
|  +--------------------+  +--------------------+  +----------------------------+ |
|  | Tournament Engine  |  | Scoring Engine     |  | Audit & Security Subsystem | |
|  | - Stage transitions|  | - Pure math rules  |  | - Immutable action logs    | |
|  | - Group allocation |  | - Tie-breaker tree |  | - Role authorization       | |
|  | - Room concurrency |  | - Point resolution|  | - Credential concealment   | |
|  +--------------------+  +--------------------+  +----------------------------+ |
+---------------------------------------------------------------------------------+
                                      |
                                  Prisma ORM
                                      |
+---------------------------------------------------------------------------------+
|                                DATABASE TIER                                    |
|  Relational Storage (PostgreSQL-compatible, SQLite local dev / demo mode)       |
|  - Tournaments, Teams, Rosters, Rooms, Matches, Results, Penalties, Audits      |
+---------------------------------------------------------------------------------+
```

## 3. Core Architectural Principles
1. **Decoupled Scoring Engine**: The mathematical scoring algorithm is a pure, side-effect-free engine located in `@/lib/scoring`. It accepts scoring rules, match placement, kills, and team penalties, returning verified score breakdowns and tie-broken leaderboards. It is completely isolated from the UI and database.
2. **Authoritative Server Validation**: All mutations (score submissions, status transitions, penalty awards, room creation) are verified server-side with strict Zod schemas and role-based checks.
3. **State Machine Lifecycle**: Tournaments and matches adhere to explicit state machines preventing invalid transitions (e.g. results cannot be entered before a match is LIVE or COMPLETED; a match cannot be published without verification).
4. **Credential Concealment**: BGMI Room IDs and Passwords are restricted to authenticated organizers and staff; public and projector views strip sensitive lobby credentials.
5. **Audit-Logged Immutability**: All modifications to published scores, penalties, and disputes produce immutable audit trail records with before/after deltas, actor attribution, and timestamps.
6. **Zero-Friction Tournament Day UX**: Attendance, Room Setup, Match Start, Score Entry, and Verification are optimized for sub-second keyboard-driven actions.

## 4. Module Directory Structure
```
/
├── app/                      # Next.js App Router (UI & API routes)
│   ├── (auth)/               # Login & authentication views
│   ├── (dashboard)/          # Organizer core interface
│   │   ├── tournaments/      # Tournament listing, creation wizard, and detail hubs
│   │   │   └── [id]/         # Contextual tournament workspace (Overview, Teams, Groups, Schedule, Rooms, Attendance, Matches, Scoring, Leaderboard, Penalties, Disputes, Reports, Settings)
│   │   ├── teams/            # Global team database
│   │   ├── players/          # Global player database
│   │   ├── matches/          # Live match operation center
│   │   ├── rooms/            # Room credential operations
│   │   ├── attendance/       # Fast-checkin hub
│   │   ├── leaderboard/      # Overall standings view
│   │   ├── penalties/        # Penalty ledger
│   │   ├── disputes/         # Dispute management center
│   │   ├── reports/          # Report generation and export
│   │   └── settings/         # System settings and audit logs
│   ├── display/              # Read-only public / stream overlay mode
│   └── api/                  # RESTful API handlers
├── components/               # Reusable UI component library
│   ├── ui/                   # Primitive design system components (buttons, dialogs, inputs, badges, cards, tables)
│   ├── tournament/           # Tournament-specific views & wizards
│   ├── match/                # Match operations & score entry grid
│   ├── leaderboard/          # Ranked tables & tie-breaker indicators
│   └── shared/               # Navigation, headers, shortcut dialog, demo controls
├── lib/                      # Core business logic & utilities
│   ├── db.ts                 # Prisma client instance
│   ├── scoring/              # Configurable scoring engine (Pure functions)
│   ├── tournament/           # Tournament scheduling & state machine
│   ├── auth/                 # Session, RBAC, and permission helpers
│   ├── validation/           # Zod schemas for all payload validations
│   ├── export/               # CSV/JSON/Print export formatters
│   └── utils.ts              # UI helpers and formatting functions
├── prisma/                   # Database schema & migrations
│   ├── schema.prisma         # Normalized database definition
│   └── seed.ts               # Demo tournament seed data
├── docs/                     # Full engineering documentation
├── tasks/                    # Agent coordination & task boards
└── tests/                    # Vitest unit & integration test suites
```
