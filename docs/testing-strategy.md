# BGMI Tournament Control Center — Testing Strategy

## 1. Test Pyramid & Scope
The test suite ensures 100% mathematical accuracy of competition results and rock-solid state machine transitions.

```
          / \
         / E2E\        -> E2E Organizer Workflow (Create -> Schedule -> Score -> Verify -> Finalize)
        /------\
       / Integr \      -> API endpoints, Database cascading, State transitions
      /----------\
     /    Unit    \    -> Pure Scoring Engine, Tie-breaker tree, Scheduler conflict detection
    /--------------\
```

## 2. Critical Scoring Engine Test Matrix
The scoring engine (`lib/scoring/engine.ts`) is subjected to exhaustive unit tests:
1. **Official BGIS 10-Point System Verification**:
   - 1st place with 12 kills = 10 + 12 = 22 pts.
   - 2nd place with 4 kills = 6 + 4 = 10 pts.
   - 8th place with 1 kill = 1 + 1 = 2 pts.
   - 9th place with 0 kills = 0 + 0 = 0 pts.
2. **BMPS 15-Point System Verification**:
   - 1st place = 15 pts; 2nd = 12 pts; 3rd = 10 pts, etc.
3. **Multi-Tier Tie-Breaker Verification**:
   - Tie on Total Points -> Team with more WWCDs wins.
   - Tie on Total Points & WWCDs -> Team with more Placement Points wins.
   - Tie on Total Points, WWCDs, & Placement Points -> Team with more Kill Points wins.
   - Tie on all three -> Team with highest single match total wins.
4. **Edge Cases**:
   - Zero kills across all teams.
   - Maximum kills (e.g. 50+ kills).
   - Penalties reducing score (guarded non-negative or floor handling).
   - Bonus points added correctly.
   - Disqualified and withdrawn team handling.

## 3. Tournament Engine & State Transition Tests
1. **Lobby Capacity Validation**: Preventing more than 16 (or custom 25) teams per match.
2. **Room Double-Booking Guard**: Rejecting scheduled matches overlapping in the same room.
3. **Group Lock Guard**: Rejection of shuffle actions when group is locked.
4. **Finalization Pre-flight Guard**: Ensuring finalization fails if any match is unverified or open disputes exist.

## 4. Test Runner Configuration
- Test framework: `vitest`
- Run command: `npm test`
- Coverage target: >90% on competition and scoring engines.
