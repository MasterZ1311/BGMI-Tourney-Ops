# BGMI Tournament Control Center — Multi-Agent Coordination Protocol

## 1. Principles of Multi-Agent Development
1. **Ownership & Isolation**: No agent modifies files outside its declared domain without coordinating through Agent 0 (Architect / Tech Lead).
2. **Modular Architecture**: Business logic is separated into independent modules:
   - `lib/scoring/` -> Agent 5 (Scoring Engine)
   - `lib/tournament/` -> Agent 6 (Tournament Engine)
   - `prisma/` -> Agent 4 (Database Engineer)
   - `app/api/` -> Agent 3 (Backend Engineer)
   - `components/` & `app/(dashboard)/` -> Agent 2 (Frontend Engineer)
   - `lib/auth/` & security validations -> Agent 7 (Security Engineer)
   - `tests/` -> Agent 8 (QA / Test Engineer)
   - Build, configs, and CI -> Agent 9 (DevOps)
3. **Task Tracking**: All agents read and update `tasks/task-board.md` before claiming or completing work.
4. **Conflict Resolution**: If two modules have interface overlaps, the database schema (`prisma/schema.prisma`) and shared types (`lib/types.ts`) are the single source of truth.

## 2. File Ownership Matrix

| Domain | Files Owned | Lead Agent |
|---|---|---|
| Architecture & Coordination | `/docs/*`, `/tasks/*` | Agent 0 (Architect) |
| Database & Seeds | `prisma/*`, `lib/db.ts` | Agent 4 (Database) |
| Core Scoring Engine | `lib/scoring/*` | Agent 5 (Scoring Engine) |
| Tournament Logic & Scheduling | `lib/tournament/*` | Agent 6 (Tournament Engine) |
| Security & RBAC | `lib/auth/*`, `middleware.ts` | Agent 7 (Security) |
| Backend & REST APIs | `app/api/*`, `lib/validation/*` | Agent 3 (Backend) |
| Frontend Components & Views | `app/(dashboard)/*`, `components/*` | Agent 2 (Frontend) |
| UX & Design Guidelines | `docs/ux.md`, Tailwind config | Agent 1 (UX Architect) |
| Tests & Quality Assurance | `tests/*`, Vitest config | Agent 8 (QA) |
| Deployment & Scripts | `Dockerfile`, `.env.example`, `package.json` | Agent 9 (DevOps) |
