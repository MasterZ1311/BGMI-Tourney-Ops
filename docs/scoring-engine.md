# BGMI Tournament Control Center — Scoring Engine Specification

## 1. Engine Philosophy
The BGMI Scoring Engine is a pure, stateless mathematical module completely separated from database queries, HTTP handlers, and UI rendering. It can run seamlessly on both server and client without external dependencies.

Location: `lib/scoring/engine.ts`

## 2. Core Scoring Formula

$$\text{Match Total Points} = \text{Placement Points} + (\text{Kills} \times \text{Kill Point Multiplier}) + \text{Bonus Points} - \text{Penalties}$$

$$\text{Tournament Total Points} = \sum_{\text{Matches}} \text{Match Total Points} - \sum \text{General Tournament Penalties}$$

## 3. Standard Presets

### Preset 1: Official BGIS 2024 / 2025 10-Point System (Standard Official)
- **1st (WWCD)**: 10 pts
- **2nd**: 6 pts
- **3rd**: 5 pts
- **4th**: 4 pts
- **5th**: 3 pts
- **6th**: 2 pts
- **7th**: 1 pt
- **8th**: 1 pt
- **9th - 16th**: 0 pts
- **Kill Point**: 1 pt per kill

### Preset 2: BMPS 15-Point System
- **1st**: 15 pts
- **2nd**: 12 pts
- **3rd**: 10 pts
- **4th**: 8 pts
- **5th**: 6 pts
- **6th**: 4 pts
- **7th**: 2 pts
- **8th - 12th**: 1 pt
- **13th - 16th**: 0 pts
- **Kill Point**: 1 pt per kill

### Preset 3: Classic PMCO 20-Point System
- **1st**: 20 pts
- **2nd**: 14 pts
- **3rd**: 10 pts
- **4th**: 8 pts
- **5th**: 7 pts
- **6th**: 6 pts
- **7th**: 5 pts
- **8th**: 4 pts
- **9th**: 3 pts
- **10th**: 2 pts
- **11th - 16th**: 1 pt
- **Kill Point**: 1 pt per kill

## 4. Multi-Tier Tie-Breaker Resolution
When two or more teams tie on cumulative tournament points, the scoring engine evaluates the following prioritized tie-breaker rules:
1. **Total WWCDs (Wins)**: Team with higher number of 1st-place finishes ranks higher.
2. **Total Placement Points**: Team with higher aggregate placement points across all matches ranks higher.
3. **Total Kill Points**: Team with higher aggregate eliminations ranks higher.
4. **Highest Single-Match Total**: Team with the single highest single-match point score ranks higher.
5. **Most Recent Match Placement**: Team that placed better in the latest played match ranks higher.
6. **Head-to-Head / Coin Toss**: Flagged if identical on all criteria.

## 5. Validation & Edge Cases Handled
- **Duplicate Placements**: Engine rejects match score sheets where two teams claim the exact same placement (unless specifically flagged as draw/simultaneous wipeout rule).
- **Zero Kills / High Kills**: Supports 0 kills up to maximum theoretical lobby wipes (60+).
- **No-Show Teams**: Placed at 16th with 0 kills and 0 placement points.
- **Disqualified Teams (DQ)**: Placement set to last, kills zeroed or preserved depending on DQ policy, marked with status `DISQUALIFIED` and omitted from qualification cutoff.
- **Penalty Exceeding Score**: Total score cannot fall below 0 in official standings unless the tournament rule explicitly permits negative carry-over.
