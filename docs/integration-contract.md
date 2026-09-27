# BGMI Tournament Organizer Platform — Integration Contract

## 1. Owner & Scope

- **Exclusive Agent Owner**: **Agent 10 (Senior Integration Engineer)**
- **Role**: Reconcile cross-module dependencies, verify end-to-end user workflows, audit type consistency, resolve reported integration requests, and execute final platform verification.
- **Operating Phase**: **Stage 3** (Executed strictly after Agents 1 through 9 have completed their parallel batch execution).

---

## 2. Integration Log Reconciliation Protocol

Throughout Stage 2, whenever an agent encountered a cross-boundary dependency, they logged the item into [`/tasks/integration-needed.md`](file:///e:/Github/BGMI%20Brackets/tasks/integration-needed.md).

Agent 10 must:
1. Sequentially inspect every item logged in `/tasks/integration-needed.md`.
2. Determine the authoritative contract file governing the interaction.
3. Implement necessary glue code, interface adapters, or configuration bridges without breaking the domain purity of the underlying engines.
4. Mark the item as `[RESOLVED]` with reference to the resolving commit or file.

---

## 3. The 9-Phase Integration & Audit Pipeline

### Phase 1: Build & Static Typecheck Audit
- Execute `npm run build` and `npx tsc --noEmit`.
- Verify zero TypeScript compiler errors across all directories (`app/`, `components/`, `lib/`, `tests/`, `scripts/`).
- Verify ESLint passes without fatal errors.

### Phase 2: Inter-Module Contract Audit
Verify boundary conformance across each interface:
- **Frontend ↔ REST API**: Verify fetch URLs, HTTP methods, and payload structures match `docs/api-contract.md`.
- **API ↔ Domain Engines**: Verify route handlers call `lib/scoring/engine.ts` and `lib/tournament/engine.ts` using strict typed DTOs.
- **Engines ↔ Database**: Verify database models match `docs/database-contract.md` and query results are properly mapped to domain interfaces.
- **Security ↔ Route Handlers**: Verify authorization checks exist on all mutating endpoints (`POST`, `PATCH`, `PUT`, `DELETE`).

### Phase 3: Complete End-to-End Tournament Simulation
Execute and verify the full tournament lifecycle:
```
1. Create Tournament (via 7-step wizard)
2. Add & Import 16 Teams (verify roster UID uniqueness)
3. Allocate & Lock Groups (Group A to D)
4. Generate Match Schedule (conflict-free timetable across Erangel, Miramar, Sanhok, Vikendi)
5. Assign Room Credentials (ID and Password)
6. Run Lobby Attendance Check-in
7. Start Match & Mark Live
8. Enter 16-Row Match Scores (with instant validation)
9. Submit -> Verify -> Publish Score Sheet
10. Verify Live Leaderboard Recalculation (with WWCD badges & tie-breaker chips)
11. Issue Penalty Deduction & Adjudicate Protest Dispute
12. Verify Pre-flight Finalization Audit Checklist
13. Execute Final Tournament Lock
```

### Phase 4: Data Integrity Verification
Confirm zero tolerance for:
- Duplicate team assignments in a match.
- Players registered to multiple active teams in the same tournament.
- Conflicting room assignments or double-booked schedules.
- Silent modifications to published score sheets.

### Phase 5: Security & RBAC Penetration Audit
- Attempt unauthorized access to sensitive endpoints without required roles.
- Verify masked room passwords on public/observer display endpoints (`/display` and `GET /api/matches/[id]/room`).
- Verify that score editing is locked once a match is `PUBLISHED`.

### Phase 6: UI / UX Operational Audit
- Test keyboard navigation across the 16-row Fast Score Entry grid.
- Test responsive behavior across Desktop, Tablet, and Mobile.
- Verify Loading, Empty, and Error states across all tournament subviews.

### Phase 7: Performance & Render Audit
- Check for unnecessary re-renders in tables.
- Verify absence of N+1 database queries.
- Ensure database indexes are utilized for foreign keys.

### Phase 8: Documentation Sync
Ensure all documentation files reflect the actual working implementation:
- `README.md`
- `docs/database-schema.md`
- `docs/api-spec.md`
- `docs/scoring-engine.md`
- `docs/tournament-engine.md`

### Phase 9: Codebase Sanitization
- Remove lingering debug logs, test bundles, and broken TODOs.
- Preserve intentional seed and demo scripts.

---

## 4. Final System Status Acceptance Schema

At completion, Agent 10 must output the authoritative system verification scorecard:

```markdown
========================================================
  FINAL SYSTEM STATUS SCORECARD
========================================================
BUILD:                 [PASS / FAIL]
TYPECHECK:             [PASS / FAIL]
LINT:                  [PASS / FAIL]
UNIT TESTS:            [PASS / FAIL]
INTEGRATION TESTS:     [PASS / FAIL]
E2E WORKFLOW:          [PASS / FAIL]
SECURITY & RBAC:       [PASS / FAIL]
DATABASE & SEED:       [PASS / FAIL]
SCORING ENGINE:        [PASS / FAIL]
TOURNAMENT ENGINE:     [PASS / FAIL]
DEPLOYMENT:            [PASS / FAIL]
========================================================
```
