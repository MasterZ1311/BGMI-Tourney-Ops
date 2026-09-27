# Agent 4 Task: BGMI Scoring Engine Specialist

> **STOP CONDITION**: If completing your task requires modifying a file owned by another agent, DO NOT modify that file. Instead, record the required interface/change in [`/tasks/integration-needed.md`](file:///e:/Github/BGMI%20Brackets/tasks/integration-needed.md), continue working on everything else that is independently possible, and report the dependency.

---

## 1. Role & Identity
You are **AGENT 4 — BGMI SCORING ENGINE SPECIALIST**.  
Your responsibility is to build and maintain the isolated, pure mathematical, deterministic BGMI tournament scoring engine.

---

## 2. Mandatory Reading Before Starting
1. [`/docs/agent-contract.md`](file:///e:/Github/BGMI%20Brackets/docs/agent-contract.md)
2. [`/docs/scoring-contract.md`](file:///e:/Github/BGMI%20Brackets/docs/scoring-contract.md)
3. [`/docs/shared-types-contract.md`](file:///e:/Github/BGMI%20Brackets/docs/shared-types-contract.md)

---

## 3. Strict Boundary Rules
- **Your Exclusive Ownership**:
  - `lib/scoring/engine.ts`
  - `lib/scoring/presets.ts`
  - `lib/scoring/types.ts`
  - `tests/scoring.test.ts`
  - `docs/scoring-engine.md`
- **Prohibited Files (DO NOT MODIFY)**:
  - Frontend React components (`components/**`, `app/**`)
  - API routes (`app/api/**`)
  - Database schema (`prisma/schema.prisma`)
  - Tournament scheduling (`lib/tournament/**`)
  - Authentication & deployment configs

---

## 4. Key Responsibilities & Tasks

### 4.1. Core Mathematical Pure Functions
- `calculateMatchScores(rule: ScoringRuleConfig, rawScores: RawTeamMatchInput[]): CalculatedTeamMatchScore[]`
  - Placement Points mapped from `rule.placementPoints[placement] || 0`.
  - Kill Points = `kills * rule.killPointsPerElim`.
  - Net Points = `placementPoints + killPoints + bonus - penalty`.
  - `isWwcd` flagged if `placement === 1`.
- `calculateStandings(rule: ScoringRuleConfig, matchScores: CalculatedTeamMatchScore[][], penalties: PenaltyRecord[], teams: TeamEntity[]): CumulativeTeamStanding[]`
  - Aggregates points, kills, WWCDs, and best match scores.
  - Multi-tier tie-breaker evaluation based on `rule.tieBreakers`.
- `validateMatchScores(scores: RawTeamMatchInput[]): ScoringValidationResult`
  - Rejects duplicate ranks in a match.
  - Rejects negative kill counts.

### 4.2. Presets Library (`lib/scoring/presets.ts`)
- Official BGIS 10-Point System (10, 6, 5, 4, 3, 2, 1, 1, 0...).
- BMPS 15-Point System (15, 12, 10, 8, 6, 4, 2, 1, 0...).
- Classic PMCO 20-Point System.

### 4.3. Unit Test Verification
- Keep 100% test coverage in `tests/scoring.test.ts` covering placements, kills, penalties, bonuses, ties, and edge cases.

---

## 5. Standard Completion Report

Upon task completion, publish your final report:
```markdown
### AGENT 4 COMPLETION REPORT: SCORING ENGINE

#### 1. ENGINE API & FUNCTIONS
#### 2. PRESETS SUPPORTED
#### 3. TIE-BREAKER LOGIC VERIFIED
#### 4. EDGE CASES TESTED
#### 5. FILES MODIFIED
#### 6. DEPENDENCIES ON OTHER AGENTS
#### 7. INTEGRATION NOTES
```
