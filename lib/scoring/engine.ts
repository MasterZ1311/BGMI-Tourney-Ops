import {
  ScoringRuleConfig,
  RawTeamMatchInput,
  CalculatedTeamMatchScore,
  CumulativeTeamStanding,
  ScoringValidationResult,
  TieBreakerCriterion,
} from './types';

/**
 * Validate match score inputs for duplicates, negative kills, or missing teams
 */
export function validateMatchScoreInputs(
  inputs: RawTeamMatchInput[],
  expectedTeamsCount = 16
): ScoringValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!inputs || inputs.length === 0) {
    return { isValid: false, errors: ['No team score entries provided.'], warnings: [] };
  }

  const seenTeams = new Set<string>();
  const seenPlacements = new Set<number>();

  for (const row of inputs) {
    if (!row.teamId) {
      errors.push('One or more rows have an empty team selection.');
    } else if (seenTeams.has(row.teamId)) {
      errors.push(`Duplicate team entry detected for team: ${row.teamId}`);
    } else {
      seenTeams.add(row.teamId);
    }

    if (row.placement < 1) {
      errors.push(`Invalid placement rank (${row.placement}). Must be 1 or greater.`);
    } else if (seenPlacements.has(row.placement)) {
      errors.push(`Duplicate placement rank #${row.placement} entered.`);
    } else {
      seenPlacements.add(row.placement);
    }

    if (row.kills < 0) {
      errors.push(`Kills cannot be negative (got ${row.kills} for team ${row.teamId}).`);
    }

    if (row.kills > 60) {
      warnings.push(`Team ${row.teamId} has unusually high kill count (${row.kills}).`);
    }
  }

  if (inputs.length < expectedTeamsCount) {
    warnings.push(
      `Received ${inputs.length} teams, fewer than expected standard lobby size (${expectedTeamsCount}).`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculate single match score for an individual team
 */
export function calculateSingleTeamScore(
  input: RawTeamMatchInput,
  rule: ScoringRuleConfig
): CalculatedTeamMatchScore {
  const placementPts = rule.placementPoints[input.placement] ?? 0;
  const killPts = (input.kills || 0) * (rule.killPointsPerElim || 1.0);
  const bonus = (input.bonusPoints || 0) + (input.placement === 1 ? (rule.wwcdBonus || 0) : 0);
  const penalty = input.penaltyPoints || 0;

  const total = Math.max(0, placementPts + killPts + bonus - penalty);

  return {
    teamId: input.teamId,
    placement: input.placement,
    kills: input.kills || 0,
    placementPoints: placementPts,
    killPoints: killPts,
    bonusPoints: bonus,
    penaltyPoints: penalty,
    totalPoints: total,
    isWwcd: input.placement === 1,
    notes: input.notes,
  };
}

/**
 * Calculate all team scores for a match
 */
export function calculateMatchScores(
  inputs: RawTeamMatchInput[],
  rule: ScoringRuleConfig
): CalculatedTeamMatchScore[] {
  return inputs
    .map((input) => calculateSingleTeamScore(input, rule))
    .sort((a, b) => a.placement - b.placement);
}

/**
 * Comparator for evaluating two teams based on a specific tie-breaker criterion
 */
function compareByCriterion(
  a: CumulativeTeamStanding,
  b: CumulativeTeamStanding,
  criterion: TieBreakerCriterion
): number {
  switch (criterion) {
    case 'WWCD':
      return b.wwcdCount - a.wwcdCount;
    case 'PLACEMENT_POINTS':
      return b.placementPoints - a.placementPoints;
    case 'KILL_POINTS':
      return b.killPoints - a.killPoints;
    case 'BEST_MATCH':
      return b.bestMatchScore - a.bestMatchScore;
    case 'LAST_MATCH':
      return a.lastMatchPlacement - b.lastMatchPlacement; // Lower placement number = better rank
    default:
      return 0;
  }
}

/**
 * Aggregate match results and general penalties to produce authoritative cumulative tournament leaderboard
 */
export function calculateTournamentLeaderboard(
  teams: Array<{ id: string; name: string; tag: string }>,
  matchScores: Array<{
    matchId: string;
    matchNumber: number;
    teamScores: CalculatedTeamMatchScore[];
  }>,
  penalties: Array<{ teamId: string; pointsDeducted: number; status: string }> = [],
  rule: ScoringRuleConfig
): CumulativeTeamStanding[] {
  const standingsMap = new Map<string, CumulativeTeamStanding>();

  // Initialize standings for all active teams
  for (const t of teams) {
    standingsMap.set(t.id, {
      rank: 1,
      teamId: t.id,
      teamName: t.name,
      teamTag: t.tag,
      matchesPlayed: 0,
      wwcdCount: 0,
      placementPoints: 0,
      killPoints: 0,
      bonusPoints: 0,
      penaltyPoints: 0,
      totalPoints: 0,
      bestMatchScore: 0,
      lastMatchPlacement: 999,
    });
  }

  // Sort matches chronologically by matchNumber
  const sortedMatches = [...matchScores].sort((m1, m2) => m1.matchNumber - m2.matchNumber);

  for (const match of sortedMatches) {
    for (const score of match.teamScores) {
      const standing = standingsMap.get(score.teamId);
      if (!standing) continue;

      standing.matchesPlayed += 1;
      if (score.isWwcd) standing.wwcdCount += 1;
      standing.placementPoints += score.placementPoints;
      standing.killPoints += score.killPoints;
      standing.bonusPoints += score.bonusPoints;
      standing.penaltyPoints += score.penaltyPoints;

      if (score.totalPoints > standing.bestMatchScore) {
        standing.bestMatchScore = score.totalPoints;
      }
      standing.lastMatchPlacement = score.placement;
    }
  }

  // Deduct general tournament-level penalties (status ACTIVE)
  for (const p of penalties) {
    if (p.status !== 'ACTIVE') continue;
    const standing = standingsMap.get(p.teamId);
    if (standing) {
      standing.penaltyPoints += p.pointsDeducted;
    }
  }

  // Calculate net total points for each team
  for (const standing of standingsMap.values()) {
    standing.totalPoints = Math.max(
      0,
      standing.placementPoints + standing.killPoints + standing.bonusPoints - standing.penaltyPoints
    );
  }

  const standingsList = Array.from(standingsMap.values());

  // Prioritized tie-breaker sorting
  standingsList.sort((a, b) => {
    // 1. Primary: Net Total Points (descending)
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }

    // 2. Tie-breakers according to configured rules
    const criteria = rule.tieBreakers || [
      'WWCD',
      'PLACEMENT_POINTS',
      'KILL_POINTS',
      'BEST_MATCH',
      'LAST_MATCH',
    ];

    for (const crit of criteria) {
      const diff = compareByCriterion(a, b, crit);
      if (diff !== 0) {
        return diff;
      }
    }

    // 3. Fallback: alphabetical team name
    return a.teamName.localeCompare(b.teamName);
  });

  // Assign 1-based ranks
  return standingsList.map((st, idx) => ({
    ...st,
    rank: idx + 1,
  }));
}
