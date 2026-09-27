# BGMI Tournament Organizer Platform — Scoring Engine Contract

## 1. Owner & Scope

- **Exclusive Agent Owner**: **Agent 4 (BGMI Scoring Engine Specialist)**
- **Owned Paths**:
  - `lib/scoring/engine.ts`
  - `lib/scoring/presets.ts`
  - `lib/scoring/types.ts`
  - `tests/scoring.test.ts`
  - `docs/scoring-engine.md`
- **Prohibited Modifications**:
  - Frontend components (`components/**`, `app/**`)
  - API routes (`app/api/**`)
  - Database schema (`prisma/schema.prisma`)
  - Tournament scheduling (`lib/tournament/**`)
  - Authentication & deployment configs

> ### 🛑 STOP CONDITION
> If completing your task requires modifying a file owned by another agent, DO NOT modify that file. Instead, record the required interface/change in [`/tasks/integration-needed.md`](file:///e:/Github/BGMI%20Brackets/tasks/integration-needed.md), continue working on everything else that is independently possible, and report the dependency.

---

## 2. Core Principles of the Scoring Engine

1. **Pure Mathematical Calculation**:
   - The engine must be 100% side-effect-free.
   - Absolutely NO database operations, network calls, or React imports inside the core calculation functions.
2. **Strict Determinism**:
   - For any given tuple of `(ScoringRuleConfig, RawTeamMatchInput[], Penalty[])`, the engine must return the exact same scores and ranked standings every time.
3. **Zero Hardcoded Formats**:
   - All placement points, kill multipliers, and tie-breaker orders must come from configuration objects.
4. **Resilient to Missing / Irregular Data**:
   - Supports 0 kills, 0 placement points, partial match participant counts, withdrawn teams, and disqualifications.

---

## 3. Data Types & Contracts

### 3.1. Scoring Configuration (`ScoringRuleConfig`)
```typescript
export type PlacementPointMap = Record<number, number>;

export type TieBreakerCriterion =
  | 'WWCD'
  | 'PLACEMENT_POINTS'
  | 'KILL_POINTS'
  | 'BEST_MATCH'
  | 'LAST_MATCH';

export interface ScoringRuleConfig {
  id?: string;
  name: string;
  placementPoints: PlacementPointMap;
  killPointsPerElim: number;
  wwcdBonus: number;
  tieBreakers: TieBreakerCriterion[];
}
```

### 3.2. Raw Input & Calculated Output
```typescript
export interface RawTeamMatchInput {
  teamId: string;
  placement: number; // 1-25
  kills: number;     // >= 0
  bonusPoints?: number;
  penaltyPoints?: number;
  notes?: string;
}

export interface CalculatedTeamMatchScore {
  teamId: string;
  placement: number;
  kills: number;
  placementPoints: number;
  killPoints: number;
  bonusPoints: number;
  penaltyPoints: number;
  totalPoints: number;
  isWwcd: boolean;
  notes?: string;
}

export interface CumulativeTeamStanding {
  rank: number;
  teamId: string;
  teamName: string;
  teamTag: string;
  matchesPlayed: number;
  wwcdCount: number;
  placementPoints: number;
  killPoints: number;
  bonusPoints: number;
  penaltyPoints: number;
  totalPoints: number;
  bestMatchScore: number;
  lastMatchPlacement: number;
  tieBreakReason?: string;
}
```

---

## 4. Official Presets

The engine must ship with standard BGMI tournament configurations in `lib/scoring/presets.ts`:

1. **Official BGIS 10-Point System** (Default standard):
   - 1st: 10 pts (WWCD)
   - 2nd: 6 pts
   - 3rd: 5 pts
   - 4th: 4 pts
   - 5th: 3 pts
   - 6th: 2 pts
   - 7th: 1 pt
   - 8th: 1 pt
   - 9th – 16th+: 0 pts
   - Kills: 1.0 pt per elimination

2. **BMPS 15-Point System**:
   - 1st: 15 pts | 2nd: 12 pts | 3rd: 10 pts | 4th: 8 pts | 5th: 6 pts | 6th: 4 pts | 7th: 2 pts | 8th: 1 pt | 9th – 16th: 0 pts
   - Kills: 1.0 pt per elimination

3. **Classic PMCO 20-Point System**:
   - 1st: 20 pts | 2nd: 14 pts | 3rd: 10 pts | 4th: 8 pts | 5th: 7 pts | 6th: 6 pts | 7th: 5 pts | 8th: 4 pts | 9th: 3 pts | 10th: 2 pts | 11th – 16th: 1 pt
   - Kills: 1.0 pt per elimination

---

## 5. Tie-Breaker Resolution Logic

When two or more teams have identical `totalPoints`, the engine must sequentially evaluate the configured `tieBreakers` list:

1. **WWCD**: Most total Chicken Dinners (1st place finishes).
2. **PLACEMENT_POINTS**: Highest cumulative placement points across all matches.
3. **KILL_POINTS**: Highest cumulative kill points.
4. **BEST_MATCH**: Highest single-match total score.
5. **LAST_MATCH**: Better placement in the most recent chronologically completed match.

If teams remain tied across all criteria, they share the rank or proceed to organizer coin toss.

---

## 6. Validation Rules

The scoring module must expose a pure validator `validateMatchScores(scores: RawTeamMatchInput[]): ScoringValidationResult`:
- **Placement Uniqueness**: No two teams may occupy the same placement rank in a single match.
- **Placement Range**: Ranks must be positive integers between 1 and 25.
- **Non-negative Kills**: Kills cannot be negative.
- **Participation Limit**: A match cannot exceed the maximum permitted lobby size (e.g. 16 or 25 squads).
