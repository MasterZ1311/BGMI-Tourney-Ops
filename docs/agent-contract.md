# BGMI Tournament Organizer Platform — Master Agent Contract

## 1. Executive Summary & Purpose
This contract establishes the operational ground rules, file boundaries, and inter-agent communication protocols for the **BGMI Tournament Organizer Platform (BGMI Tournament Control Center - TCC)**.

Multiple autonomous agents will execute tasks concurrently. To guarantee that parallel execution produces a coherent, zero-regression software system without overwriting or race conditions, **every agent must strictly abide by the rules and boundaries outlined in this document**.

---

## 2. The Universal Stop Condition

> ### 🛑 UNIVERSAL STOP CONDITION
> **If completing your task requires modifying a file owned by another agent, DO NOT modify that file.**  
> Instead, record the required interface or change in [`/tasks/integration-needed.md`](file:///e:/Github/BGMI%20Brackets/tasks/integration-needed.md), continue working on everything else that is independently possible within your own domain, and report the dependency in your final report.

Under no circumstances should any agent bypass this rule. Shared files and inter-agent dependencies are reconciled exclusively in **Stage 3 by Agent 10 (Senior Integration Engineer)**.

---

## 3. Strict Agent Ownership Matrix

| Agent ID | Role / Specialization | Exclusive File Ownership | Prohibited Boundaries (Must NOT Touch) |
|---|---|---|---|
| **Agent 0** | **Project Coordinator & Architect** | `/docs/*-contract.md`, `/docs/system-architecture.md`, `/tasks/*` | Application product logic, DB schema, UI components |
| **Agent 1** | **Frontend & UI Engineer** | `app/**/page.tsx`, `app/**/layout.tsx`, `components/**`, CSS / Tailwind classes, UI hooks | Database schema, API route implementations, Scoring engine, Tournament engine |
| **Agent 2** | **Database Engineer** | `prisma/schema.prisma`, `prisma/migrations/**`, `prisma/seed.ts`, `prisma/seed-data.ts`, `lib/db.ts`, `lib/seed-service.ts` | Frontend components, API route handlers, UI styling, Scoring formulas |
| **Agent 3** | **Backend / API Engineer** | `app/api/**/route.ts`, backend controllers, backend services, `lib/validation/schemas.ts` | Frontend UI, Database schema migrations, Scoring calculation formulas |
| **Agent 4** | **Scoring Engine Specialist** | `lib/scoring/engine.ts`, `lib/scoring/presets.ts`, `lib/scoring/types.ts`, scoring test fixtures | React components, API routes, Database schema, Scheduler |
| **Agent 5** | **Tournament Engine Specialist** | `lib/tournament/engine.ts`, `lib/tournament/types.ts`, tournament lifecycle logic, group/schedule math | React components, Database schema, Scoring formulas, API routes |
| **Agent 6** | **Tournament Operations Specialist** | `lib/operations/**` (attendance service, room coordinator, match control state machine, result verification workflow) | Frontend UI, Database schema, Scoring engine math, Scheduler algorithms |
| **Agent 7** | **Security & RBAC Engineer** | `lib/auth/roles.ts`, `lib/auth/**`, security middleware, authorization guards, security fixtures | Product business logic, UI design, Database schema |
| **Agent 8** | **QA & Automated Testing Engineer** | `tests/**`, test utilities, mock fixtures, regression suites | Modifying production business logic to force test passes |
| **Agent 9** | **DevOps & Deployment Engineer** | `Dockerfile`, `docker-compose.yml`, `.github/workflows/**`, `scripts/deploy.sh`, `.env.example`, build configs | Frontend/Backend business logic, DB schema, Tournament algorithms |
| **Agent 10** | **Senior Integration Engineer** | Integration bridges, contract reconciliation, end-to-end audit, cross-module bug fixes | Blindly overwriting working code without verifying contracts |

---

## 4. Multi-Agent Development Workflow

### Stage 1: Foundation (Agent 0)
- Inspect environment and establish system contracts.
- Define shared types, API specs, database schemas, scoring logic, and UI architectures.
- Create all task instructions in `/tasks/`.

### Stage 2: Parallel Batch Execution (Agents 1 – 9)
- Run simultaneously in their dedicated workspaces or contexts.
- Each agent consults their respective `/tasks/agent-<role>.md` and referenced `/docs/*-contract.md`.
- No cross-agent file writes. All interface gaps logged to `/tasks/integration-needed.md`.

### Stage 3: Integration & Final Code Review (Agent 10)
- Resolve logged items in `/tasks/integration-needed.md`.
- Execute full typechecks (`tsc --noEmit`), linting, test suites (`npm test`), and production build (`npm run build`).
- Verify complete end-to-end tournament lifecycle from wizard creation to finalization.

---

## 5. Git Branching & Task Naming Standards

When utilizing Git branches or task tickets, follow this standard pattern:
- **Format**: `agent/<id>-<domain>-<feature-slug>`
- **Examples**:
  - `agent/1-frontend-score-entry-grid`
  - `agent/2-database-indexes-and-constraints`
  - `agent/3-backend-rest-endpoints`
  - `agent/4-scoring-tiebreakers`
  - `agent/5-tournament-conflict-detector`
  - `agent/6-operations-result-workflow`
  - `agent/7-security-rbac-middleware`
  - `agent/8-qa-e2e-suite`
  - `agent/9-devops-ci-pipeline`
  - `agent/10-integration-final-audit`

Commit messages must follow Conventional Commits:
`feat(<domain>): description`, `fix(<domain>): description`, `test(<domain>): description`, `docs(<domain>): description`.

---

## 6. Standard Agent Completion Report Format

Every agent must complete their work by publishing a structured report adhering strictly to this schema:

```markdown
### AGENT <ID> COMPLETION REPORT: <ROLE NAME>

#### 1. FILES CREATED
- `path/to/created/file.ts` (Purpose)

#### 2. FILES MODIFIED
- `path/to/modified/file.ts` (Exact changes made)

#### 3. FEATURES COMPLETED
- [x] Feature item 1
- [x] Feature item 2

#### 4. DEPENDENCIES ON OTHER AGENTS
- Detail any assumption made on an external contract or service.

#### 5. INTEGRATION REQUESTS FILED
- List any requests logged in `/tasks/integration-needed.md` (or "None").

#### 6. TEST & VERIFICATION STATUS
- Build command executed
- Test execution output and passing count
- Typecheck status

#### 7. INTEGRATION NOTES
- Specific notes for Agent 10 to ensure seamless connection.
```
