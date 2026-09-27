# BGMI Tournament Organizer Platform — System Architecture

## 1. System Context & Overview

The **BGMI Tournament Organizer Platform (BGMI Tournament Control Center - TCC)** is a specialized esports operations control hub engineered for Battlegrounds Mobile India (BGMI) tournament directors, head admins, lobby marshals, and scorekeepers.

Unlike traditional 1v1 tactical esports (such as CS2 or Valorant), a BGMI tournament lobby operates with **16 to 25 squads simultaneously** dropped onto large-scale maps (Erangel, Miramar, Sanhok, Vikendi). The platform manages the entire lifecycle of high-density battle royale tournaments: squad registration, roster integrity, seeded group allocation, automated map schedules, custom room credential delivery, rapid live score entry, pure mathematical score calculations, protest resolution, and pre-flight finalization.

---

## 2. Identified Repository Stack & Baseline Status

From architectural inspection, this repository is an **established, production-grade Next.js 14 full-stack TypeScript application**:

| Component | Technology | Specification / Version |
|---|---|---|
| **Runtime & Language** | Node.js & TypeScript | Node >= 20.x, TypeScript 5.6.3 |
| **Framework** | Next.js (App Router) | Next.js 14.2.15 |
| **Package Manager** | npm | `package-lock.json` present |
| **Database & ORM** | SQLite / PostgreSQL via Prisma | Prisma ORM 5.21.1 (`prisma/schema.prisma`) |
| **Frontend Styling** | Tailwind CSS & PostCSS | Tailwind CSS 3.4.14, `@tailwindcss/forms` |
| **Icons & Visuals** | Lucide React & Recharts | Lucide 0.453.0, Recharts 2.13.0 |
| **Validation** | Zod | Zod 3.23.8 |
| **Data Parsing** | PapaParse | PapaParse 5.4.1 (CSV Bulk Onboarding) |
| **Testing Engine** | Vitest / Custom Fast Bundler | `scripts/test-runner.ts` / Vitest 2.1.3 |

---

## 3. High-Level Architectural Layers

The system follows a strict **Clean Layered Architecture** with unidirectional data flow:

```
[ FRONTEND UI LAYER ]
  │  ├── App Routes: app/page.tsx, app/tournaments/[id]/page.tsx, app/display/page.tsx
  │  └── Presentation Components: components/{tournament, teams, match, attendance, ...}
  ▼
[ HTTP & REST API LAYER ]
  │  ├── Next.js Route Handlers: app/api/**/route.ts
  │  ├── Request Validation: lib/validation/schemas.ts (Zod)
  │  └── Authorization Middleware: lib/auth/roles.ts
  ▼
[ DOMAIN LOGIC ENGINES & SERVICES ]
  │  ├── Scoring Engine: lib/scoring/engine.ts (Pure mathematical placement/kill evaluator)
  │  ├── Tournament Engine: lib/tournament/engine.ts (Seeded groups, conflict-free scheduler)
  │  └── Operations Logic: Attendance, Room credential security, Protest adjudication
  ▼
[ PERSISTENCE & DATA LAYER ]
  │  ├── Prisma Client: lib/db.ts
  │  └── Relational Schema: prisma/schema.prisma (SQLite for dev, Postgres-ready)
```

---

## 4. Key Architectural Subsystems

### 4.1. Pure Mathematical Scoring Engine (`lib/scoring/`)
- Completely decoupled from React and database I/O.
- Operates as pure, side-effect-free functions taking `ScoringRuleConfig` + `RawTeamMatchInput[]` + `Penalties` and returning `CumulativeTeamStanding[]`.
- Multi-tier tie-breakers:
  1. Total WWCDs (Wins)
  2. Total Placement Points
  3. Total Kill Points
  4. Best Single Match Score
  5. Last Match Placement

### 4.2. Tournament Lifecycle & Scheduling Engine (`lib/tournament/`)
- Deterministic seeded pseudo-random group shuffle (allowing repeatable group generation).
- Intelligent schedule generator ensuring:
  - No overlapping matches for the same squad.
  - No custom room double-booking.
  - Automatic rotation across Erangel, Miramar, Sanhok, and Vikendi.
- Pre-flight finalization auditor verifying 100% match completion, score publication, and zero open disputes before locking.

### 4.3. High-Pressure Match-Day Operations (`components/match`, `components/attendance`)
- Rapid check-in desk for squad captains and rosters.
- In-game room credential generator with one-click copy and public overlay masking.
- Rapid 60-second tabular score entry grid for fast match wrap-up.
- 4-Tier Match Result State Machine:
  `DRAFT` ➔ `SUBMITTED` ➔ `VERIFIED` ➔ `PUBLISHED`.

### 4.4. Security, RBAC & Credential Protection (`lib/auth/`)
- Role-based permissions: `SUPER_ADMIN`, `TOURNAMENT_ADMIN`, `MATCH_ADMIN`, `SCOREKEEPER`, `OBSERVER`.
- Server-side authorization verification on all mutating endpoints.
- Strict room password protection: room passwords are masked on public broadcast views (`/display`) and inaccessible to unauthorized roles.

---

## 5. Architectural Non-Negotiables

1. **Deterministic Scoring**: Given identical match inputs and scoring configs, the scoring engine must produce identical mathematical standings. No database mutations inside scoring calculations.
2. **Immutability of Published Results**: Once a match status is `PUBLISHED`, scores cannot be silently altered. Any correction requires an explicit administrative audit record.
3. **Zero Roster Collisions**: A player Character ID (UID) cannot be registered on more than one active team in the same tournament.
4. **Resilient Offline / Low-Latency UX**: Tournament admins frequently run events in high-stress, noisy LAN venues. All UI tables must support dense keyboard interactions, clear visual feedback, and instantaneous error feedback.
