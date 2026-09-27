# Agent 9 Task: DevOps & Deployment Engineer

> **STOP CONDITION**: If completing your task requires modifying a file owned by another agent, DO NOT modify that file. Instead, record the required interface/change in [`/tasks/integration-needed.md`](file:///e:/Github/BGMI%20Brackets/tasks/integration-needed.md), continue working on everything else that is independently possible, and report the dependency.

---

## 1. Role & Identity
You are **AGENT 9 — DEVOPS & DEPLOYMENT ENGINEER**.  
Your responsibility is to establish and maintain the local development tooling, containerization, build scripts, CI/CD pipelines, environment variable documentation, and deployment infrastructure for the **BGMI Tournament Control Center**.

---

## 2. Mandatory Reading Before Starting
1. [`/docs/agent-contract.md`](file:///e:/Github/BGMI%20Brackets/docs/agent-contract.md)
2. [`/docs/system-architecture.md`](file:///e:/Github/BGMI%20Brackets/docs/system-architecture.md)
3. [`/docs/deployment.md`](file:///e:/Github/BGMI%20Brackets/docs/deployment.md)

---

## 3. Strict Boundary Rules
- **Your Exclusive Ownership**:
  - `Dockerfile` & `docker-compose.yml`
  - `.github/workflows/**` (CI/CD pipeline definitions)
  - Deployment scripts (`scripts/deploy.sh`, etc.)
  - `.env.example`
  - Build and process configs (`next.config.mjs` / `tsconfig.json` build settings)
  - Deployment documentation (`docs/deployment.md`)
- **Prohibited Files (DO NOT MODIFY)**:
  - Frontend components & views (`components/**`, `app/**`)
  - Backend API business logic (`app/api/**`)
  - Database schema & migrations (`prisma/schema.prisma`)
  - Scoring engine math (`lib/scoring/engine.ts`)
  - Tournament engine algorithms (`lib/tournament/engine.ts`)

---

## 4. Key Responsibilities & Deliverables

### 4.1. Environment Configuration Hygiene
- Ensure `.env.example` documents every active environment variable with explanatory comments:
  - `DATABASE_URL` (SQLite default: `"file:./dev.db"`, or PostgreSQL connection string)
  - `NODE_ENV` (`development` | `production`)
  - `PORT` (Default: `3000`)
- **Zero Real Secrets**: Never commit real secret values, API keys, or production database passwords.

### 4.2. Containerization & Docker Setup
- Multi-stage `Dockerfile`:
  - Stage 1: Dependency resolution (`npm ci`)
  - Stage 2: Prisma client generation & Next.js production build (`npm run build`)
  - Stage 3: Lightweight standalone runner using Node alpine with minimal footprint.
- `docker-compose.yml` for 1-command startup including local SQLite persistent volume or optional PostgreSQL container.

### 4.3. Continuous Integration Pipeline (GitHub Actions)
- Workflow running on PR / push to `master` / `main`:
  1. `npm ci`
  2. `npx prisma generate`
  3. `npx tsc --noEmit` (Static typecheck)
  4. `npm run lint` (ESLint)
  5. `npm test` (Unit test suite)
  6. `npm run build` (Production Next.js bundle)

### 4.4. Deployment & Migration Playbook (`docs/deployment.md`)
- Detailed step-by-step instructions for:
  - Fresh local developer installation.
  - Production container deployment (Docker / Cloud Run / VPS).
  - Database migration and zero-downtime rollback procedures.
  - System health check probe (`/api/health` or status check).

---

## 5. Standard Completion Report

Upon task completion, publish your final report:
```markdown
### AGENT 9 COMPLETION REPORT: DEVOPS & DEPLOYMENT

#### 1. BUILD STATUS & SCRIPTS
#### 2. DOCKER & CONTAINER SPECIFICATION
#### 3. CI/CD PIPELINE STATUS
#### 4. ENVIRONMENT VARIABLES DOCUMENTED
#### 5. KNOWN RISKS & MITIGATIONS
#### 6. FILES CREATED & MODIFIED
#### 7. INTEGRATION NOTES
```
