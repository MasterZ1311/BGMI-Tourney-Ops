import {
  ScoringRuleConfig,
  RawTeamMatchInput,
  CalculatedTeamMatchScore,
  CumulativeTeamStanding,
  ScoringValidationResult,
  TieBreakerCriterion,
  MatchScoreInputGroup,
  GeneralPenaltyInput,
  TeamIdentityInput,
} from './types';
import { BGIS_10_POINT_SYSTEM } from './presets';

/**
 * Validate match score inputs for duplicates, negative kills, out-of-range placements,
 * or exceeding lobby participation limits.
 */
export function validateMatchScores(
  inputs: RawTeamMatchInput[],
  expectedTeamsCount = 16
): ScoringValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!inputs || inputs.length === 0) {
    return { isValid: false, errors: ['No team score entries provided.'], warnings: [] };
  }

  // Participation limit: BGMI standard lobbies support up to 25 squads (100 players)
  if (inputs.length > 25) {
    errors.push(`Participation limit exceeded: Received ${inputs.length} teams, maximum permitted is 25.`);
  }

  const seenTeams = new Set<string>();
  const seenPlacements = new Set<number>();

  for (const row of inputs) {
    if (!row.teamId || row.teamId.trim() === '') {
      errors.push('One or more rows have an empty team selection.');
    } else if (seenTeams.has(row.teamId)) {
      errors.push(`Duplicate team entry detected for team: ${row.teamId}`);
    } else {
      seenTeams.add(row.teamId);
    }

    if (row.placement < 1) {
      errors.push(`Invalid placement rank (${row.placement}). Must be 1 or greater (between 1 and 25).`);
    } else if (row.placement > 25 || !Number.isInteger(row.placement)) {
      errors.push(`Invalid placement rank (${row.placement}). Must be an integer between 1 and 25.`);
    } else if (seenPlacements.has(row.placement)) {
      errors.push(`Duplicate placement rank #${row.placement} entered.`);
    } else {
      seenPlacements.add(row.placement);
    }

    if (row.kills < 0 || !Number.isInteger(row.kills)) {
      errors.push(`Kills cannot be negative (got ${row.kills} for team ${row.teamId}). Must be a non-negative integer.`);
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
 * Backward compatibility alias for validateMatchScores
 */
export const validateMatchScoreInputs = validateMatchScores;

/**
 * Calculate single match score for an individual team.
 * Supports overloaded argument order: (input, rule) or (rule, input).
 */
export function calculateSingleTeamScore(
  input: RawTeamMatchInput,
  rule: ScoringRuleConfig
): CalculatedTeamMatchScore;
export function calculateSingleTeamScore(
  rule: ScoringRuleConfig,
  input: RawTeamMatchInput
): CalculatedTeamMatchScore;
export function calculateSingleTeamScore(
  arg1: RawTeamMatchInput | ScoringRuleConfig,
  arg2: RawTeamMatchInput | ScoringRuleConfig
): CalculatedTeamMatchScore {
  let input: RawTeamMatchInput;
  let rule: ScoringRuleConfig;

  if ('placementPoints' in arg1) {
    rule = arg1;
    input = arg2 as RawTeamMatchInput;
  } else {
    input = arg1;
    rule = arg2 as ScoringRuleConfig;
  }

  // Handle disqualified team in a match
  if (input.isDisqualified) {
    return {
      teamId: input.teamId,
      placement: input.placement,
      kills: input.kills || 0,
      placementPoints: 0,
      killPoints: 0,
      bonusPoints: 0,
      penaltyPoints: input.penaltyPoints || 0,
      totalPoints: 0,
      isWwcd: false,
      isDisqualified: true,
      notes: input.notes ? `${input.notes} (Disqualified)` : 'Disqualified',
    };
  }

  const placementPts = rule.placementPoints[input.placement] ?? 0;
  const killPts = (input.kills || 0) * (rule.killPointsPerElim ?? 1.0);
  const bonus = (input.bonusPoints || 0) + (input.placement === 1 ? (rule.wwcdBonus || 0) : 0);
  const penalty = input.penaltyPoints || 0;

  const rawTotal = placementPts + killPts + bonus - penalty;
  const total = rule.allowNegativeScores ? rawTotal : Math.max(0, rawTotal);

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
    isDisqualified: false,
    notes: input.notes,
  };
}

/**
 * Calculate all team scores for a match and sort by placement ascending.
 * Supports overloaded argument order: (inputs, rule) or (rule, inputs).
 */
export function calculateMatchScores(
  inputs: RawTeamMatchInput[],
  rule: ScoringRuleConfig
): CalculatedTeamMatchScore[];
export function calculateMatchScores(
  rule: ScoringRuleConfig,
  inputs: RawTeamMatchInput[]
): CalculatedTeamMatchScore[];
export function calculateMatchScores(
  arg1: RawTeamMatchInput[] | ScoringRuleConfig,
  arg2: RawTeamMatchInput[] | ScoringRuleConfig
): CalculatedTeamMatchScore[] {
  let inputs: RawTeamMatchInput[];
  let rule: ScoringRuleConfig;

  if (Array.isArray(arg1)) {
    inputs = arg1;
    rule = arg2 as ScoringRuleConfig;
  } else {
    rule = arg1;
    inputs = arg2 as RawTeamMatchInput[];
  }

  return inputs
    .map((input) => calculateSingleTeamScore(input, rule))
    .sort((a, b) => a.placement - b.placement);
}

/**
 * Comparator for evaluating two teams based on a specific tie-breaker criterion.
 * Returns negative if A is better, positive if B is better, 0 if equal.
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
      // Lower placement number = better rank (e.g. 1st is better than 3rd)
      return a.lastMatchPlacement - b.lastMatchPlacement;
    default:
      return 0;
  }
}

/**
 * Format a human-readable tie break reason comparing team A (winner) and team B (loser)
 */
function describeTieBreak(
  winner: CumulativeTeamStanding,
  loser: CumulativeTeamStanding,
  criterion: TieBreakerCriterion
): string {
  switch (criterion) {
    case 'WWCD':
      return `Higher WWCD (${winner.wwcdCount} vs ${loser.wwcdCount})`;
    case 'PLACEMENT_POINTS':
      return `Higher Placement Points (${winner.placementPoints} vs ${loser.placementPoints})`;
    case 'KILL_POINTS':
      return `Higher Kill Points (${winner.killPoints} vs ${loser.killPoints})`;
    case 'BEST_MATCH':
      return `Higher Best Match Score (${winner.bestMatchScore} vs ${loser.bestMatchScore})`;
    case 'LAST_MATCH':
      return `Better Last Match Placement (#${winner.lastMatchPlacement} vs #${loser.lastMatchPlacement})`;
    default:
      return 'Tie-breaker';
  }
}

/**
 * Normalize match scores input to array of { matchId, matchNumber, teamScores }
 */
function normalizeMatchScores(
  matchScores:
    | CalculatedTeamMatchScore[][]
    | Array<{ matchId?: string; matchNumber?: number; teamScores: CalculatedTeamMatchScore[] }>
): MatchScoreInputGroup[] {
  if (!matchScores || matchScores.length === 0) {
    return [];
  }

  // Check if it is CalculatedTeamMatchScore[][]
  if (Array.isArray(matchScores[0])) {
    return (matchScores as CalculatedTeamMatchScore[][]).map((scores, idx) => ({
      matchNumber: idx + 1,
      teamScores: scores,
    }));
  }

  // Already array of match objects
  return (matchScores as Array<{
    matchId?: string;
    matchNumber?: number;
    teamScores: CalculatedTeamMatchScore[];
  }>).map((m, idx) => ({
    matchId: m.matchId,
    matchNumber: m.matchNumber ?? idx + 1,
    teamScores: m.teamScores,
  }));
}

/**
 * Core mathematical calculation engine to aggregate match scores, general penalties,
 * evaluate multi-tier tie-breakers, and construct the final authoritative tournament leaderboard.
 */
export function calculateTournamentLeaderboard(
  teams: TeamIdentityInput[],
  matchScores:
    | CalculatedTeamMatchScore[][]
    | Array<{ matchId?: string; matchNumber?: number; teamScores: CalculatedTeamMatchScore[] }>,
  penalties: GeneralPenaltyInput[] = [],
  rule: ScoringRuleConfig = BGIS_10_POINT_SYSTEM
): CumulativeTeamStanding[] {
  const standingsMap = new Map<string, CumulativeTeamStanding>();

  // 1. Initialize standings for all registered teams
  for (const t of teams || []) {
    const isDq = t.status === 'DISQUALIFIED';
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
      status: t.status || 'ACTIVE',
      isDisqualified: isDq,
    });
  }

  // 2. Sort matches chronologically by matchNumber
  const normalizedMatches = normalizeMatchScores(matchScores);
  const sortedMatches = [...normalizedMatches].sort((m1, m2) => m1.matchNumber - m2.matchNumber);

  for (const match of sortedMatches) {
    for (const score of match.teamScores) {
      let standing = standingsMap.get(score.teamId);
      if (!standing) {
        // Auto-register team if played in match but missing from initial teams list
        standing = {
          rank: 1,
          teamId: score.teamId,
          teamName: score.teamId,
          teamTag: 'UNK',
          matchesPlayed: 0,
          wwcdCount: 0,
          placementPoints: 0,
          killPoints: 0,
          bonusPoints: 0,
          penaltyPoints: 0,
          totalPoints: 0,
          bestMatchScore: 0,
          lastMatchPlacement: 999,
          status: 'ACTIVE',
          isDisqualified: false,
        };
        standingsMap.set(score.teamId, standing);
      }

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

      if (score.isDisqualified) {
        standing.isDisqualified = true;
      }
    }
  }

  // 3. Deduct tournament-level penalties (ACTIVE or unflagged)
  for (const p of penalties || []) {
    if (p.status && p.status !== 'ACTIVE') continue;
    const standing = standingsMap.get(p.teamId);
    if (standing) {
      standing.penaltyPoints += p.pointsDeducted;
    }
  }

  // 4. Calculate net total points for each team
  for (const standing of standingsMap.values()) {
    const rawTotal =
      standing.placementPoints + standing.killPoints + standing.bonusPoints - standing.penaltyPoints;
    standing.totalPoints = rule.allowNegativeScores ? rawTotal : Math.max(0, rawTotal);
  }

  const standingsList = Array.from(standingsMap.values());
  const criteria = rule.tieBreakers && rule.tieBreakers.length > 0
    ? rule.tieBreakers
    : (['WWCD', 'PLACEMENT_POINTS', 'KILL_POINTS', 'BEST_MATCH', 'LAST_MATCH'] as TieBreakerCriterion[]);

  // 5. Prioritized tie-breaker sorting
  standingsList.sort((a, b) => {
    // 5.1. Disqualification status: Disqualified teams are always relegated to the bottom
    const aDq = a.isDisqualified || a.status === 'DISQUALIFIED';
    const bDq = b.isDisqualified || b.status === 'DISQUALIFIED';
    if (aDq !== bDq) {
      return aDq ? 1 : -1;
    }

    // 5.2. Primary: Net Total Points (descending)
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }

    // 5.3. Multi-tier Tie-breakers according to configured rules
    for (const crit of criteria) {
      const diff = compareByCriterion(a, b, crit);
      if (diff !== 0) {
        return diff;
      }
    }

    // 5.4. Fallback: alphabetical team name
    return a.teamName.localeCompare(b.teamName);
  });

  // 6. Determine and annotate tie-break reasons
  for (let i = 0; i < standingsList.length; i++) {
    const current = standingsList[i];
    if (current.isDisqualified || current.status === 'DISQUALIFIED') {
      current.tieBreakReason = 'Disqualified from tournament';
      continue;
    }

    const prev = i > 0 ? standingsList[i - 1] : null;
    const next = i < standingsList.length - 1 ? standingsList[i + 1] : null;

    // Check if tied on total points with neighbor
    const isTiedWithPrev = prev !== null && prev.totalPoints === current.totalPoints && !prev.isDisqualified;
    const isTiedWithNext = next !== null && next.totalPoints === current.totalPoints && !next.isDisqualified;

    if (isTiedWithNext) {
      // Find what broke tie in favor of current over next
      let resolvedCrit: TieBreakerCriterion | null = null;
      for (const crit of criteria) {
        if (compareByCriterion(current, next, crit) !== 0) {
          resolvedCrit = crit;
          break;
        }
      }
      if (resolvedCrit) {
        current.tieBreakReason = describeTieBreak(current, next, resolvedCrit);
      } else {
        current.tieBreakReason = 'Tied on all criteria (alphabetical)';
      }
    } else if (isTiedWithPrev) {
      // Tied with prev, but lost tie-breaker
      let resolvedCrit: TieBreakerCriterion | null = null;
      for (const crit of criteria) {
        if (compareByCriterion(prev, current, crit) !== 0) {
          resolvedCrit = crit;
          break;
        }
      }
      if (resolvedCrit) {
        current.tieBreakReason = `Tie broken via ${resolvedCrit}`;
      } else {
        current.tieBreakReason = 'Tied on all criteria (alphabetical)';
      }
    }
  }

  // 7. Assign 1-based ranks
  return standingsList.map((st, idx) => ({
    ...st,
    rank: idx + 1,
  }));
}

/**
 * Standard contract alias: calculateStandings
 * Supports either:
 * - calculateStandings(rule, matchScores, penalties?, teams?)
 * - calculateStandings(teams, matchScores, penalties?, rule?)
 */
export function calculateStandings(
  rule: ScoringRuleConfig,
  matchScores:
    | CalculatedTeamMatchScore[][]
    | Array<{ matchId?: string; matchNumber?: number; teamScores: CalculatedTeamMatchScore[] }>,
  penalties?: GeneralPenaltyInput[],
  teams?: TeamIdentityInput[]
): CumulativeTeamStanding[];
export function calculateStandings(
  teams: TeamIdentityInput[],
  matchScores:
    | CalculatedTeamMatchScore[][]
    | Array<{ matchId?: string; matchNumber?: number; teamScores: CalculatedTeamMatchScore[] }>,
  penalties?: GeneralPenaltyInput[],
  rule?: ScoringRuleConfig
): CumulativeTeamStanding[];
export function calculateStandings(
  arg1: ScoringRuleConfig | TeamIdentityInput[],
  matchScores:
    | CalculatedTeamMatchScore[][]
    | Array<{ matchId?: string; matchNumber?: number; teamScores: CalculatedTeamMatchScore[] }>,
  penalties: GeneralPenaltyInput[] = [],
  arg4?: TeamIdentityInput[] | ScoringRuleConfig
): CumulativeTeamStanding[] {
  let rule: ScoringRuleConfig;
  let teams: TeamIdentityInput[];

  if (Array.isArray(arg1)) {
    teams = arg1;
    rule = (arg4 as ScoringRuleConfig) || BGIS_10_POINT_SYSTEM;
  } else {
    rule = arg1;
    teams = (arg4 as TeamIdentityInput[]) || [];
  }

  return calculateTournamentLeaderboard(teams, matchScores, penalties, rule);
}
