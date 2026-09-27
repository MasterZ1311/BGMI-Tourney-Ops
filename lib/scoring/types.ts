export type PlacementPointMap = Record<number, number>;

export type TieBreakerCriterion =
  | 'WWCD'
  | 'PLACEMENT_POINTS'
  | 'KILL_POINTS'
  | 'BEST_MATCH'
  | 'LAST_MATCH';

export interface ScoringRuleConfig {
  id?: string;
  tournamentId?: string;
  name: string;
  placementPoints: PlacementPointMap;
  killPointsPerElim: number;
  wwcdBonus: number;
  tieBreakers: TieBreakerCriterion[];
  allowNegativeScores?: boolean;
}

export interface RawTeamMatchInput {
  teamId: string;
  placement: number; // 1-25
  kills: number;     // >= 0
  bonusPoints?: number;
  penaltyPoints?: number;
  isDisqualified?: boolean;
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
  isDisqualified?: boolean;
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
  status?: string;
  isDisqualified?: boolean;
}

export interface ScoringValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface MatchScoreInputGroup {
  matchId?: string;
  matchNumber: number;
  teamScores: CalculatedTeamMatchScore[];
}

export interface GeneralPenaltyInput {
  teamId: string;
  pointsDeducted: number;
  status?: string;
  reason?: string;
}

export interface TeamIdentityInput {
  id: string;
  name: string;
  tag: string;
  status?: string;
}
