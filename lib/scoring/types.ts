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

export interface RawTeamMatchInput {
  teamId: string;
  placement: number;
  kills: number;
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

export interface ScoringValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
