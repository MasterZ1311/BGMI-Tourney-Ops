import { ScoringRuleConfig } from './types';

/**
 * Official BGIS 2024 / 2025 10-Point Scoring System
 * 1st: 10, 2nd: 6, 3rd: 5, 4th: 4, 5th: 3, 6th: 2, 7th: 1, 8th: 1, 9-16: 0
 * 1 Kill = 1 Point
 */
export const BGIS_10_POINT_SYSTEM: ScoringRuleConfig = {
  name: 'Official BGIS 10-Point System',
  placementPoints: {
    1: 10,
    2: 6,
    3: 5,
    4: 4,
    5: 3,
    6: 2,
    7: 1,
    8: 1,
    9: 0,
    10: 0,
    11: 0,
    12: 0,
    13: 0,
    14: 0,
    15: 0,
    16: 0,
  },
  killPointsPerElim: 1.0,
  wwcdBonus: 0.0,
  tieBreakers: [
    'WWCD',
    'PLACEMENT_POINTS',
    'KILL_POINTS',
    'BEST_MATCH',
    'LAST_MATCH',
  ],
};

/**
 * BMPS 15-Point System
 * 1st: 15, 2nd: 12, 3rd: 10, 4th: 8, 5th: 6, 6th: 4, 7th: 2, 8-12: 1, 13-16: 0
 * 1 Kill = 1 Point
 */
export const BMPS_15_POINT_SYSTEM: ScoringRuleConfig = {
  name: 'BMPS 15-Point System',
  placementPoints: {
    1: 15,
    2: 12,
    3: 10,
    4: 8,
    5: 6,
    6: 4,
    7: 2,
    8: 1,
    9: 1,
    10: 1,
    11: 1,
    12: 1,
    13: 0,
    14: 0,
    15: 0,
    16: 0,
  },
  killPointsPerElim: 1.0,
  wwcdBonus: 0.0,
  tieBreakers: [
    'WWCD',
    'PLACEMENT_POINTS',
    'KILL_POINTS',
    'BEST_MATCH',
    'LAST_MATCH',
  ],
};

/**
 * Classic PMCO 20-Point System
 * 1st: 20, 2nd: 14, 3rd: 10, 4th: 8, 5th: 7, 6th: 6, 7th: 5, 8th: 4, 9th: 3, 10th: 2, 11-16: 1
 * 1 Kill = 1 Point
 */
export const PMCO_20_POINT_SYSTEM: ScoringRuleConfig = {
  name: 'Classic PMCO 20-Point System',
  placementPoints: {
    1: 20,
    2: 14,
    3: 10,
    4: 8,
    5: 7,
    6: 6,
    7: 5,
    8: 4,
    9: 3,
    10: 2,
    11: 1,
    12: 1,
    13: 1,
    14: 1,
    15: 1,
    16: 1,
  },
  killPointsPerElim: 1.0,
  wwcdBonus: 0.0,
  tieBreakers: [
    'WWCD',
    'PLACEMENT_POINTS',
    'KILL_POINTS',
    'BEST_MATCH',
    'LAST_MATCH',
  ],
};

export const SCORING_PRESETS: Record<string, ScoringRuleConfig> = {
  BGIS_10: BGIS_10_POINT_SYSTEM,
  BMPS_15: BMPS_15_POINT_SYSTEM,
  PMCO_20: PMCO_20_POINT_SYSTEM,
};
