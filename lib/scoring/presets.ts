import { ScoringRuleConfig } from './types';

/**
 * Official BGIS 2024 / 2025 10-Point Scoring System (Default Standard)
 * 1st: 10 pts, 2nd: 6 pts, 3rd: 5 pts, 4th: 4 pts, 5th: 3 pts, 6th: 2 pts, 7th: 1 pt, 8th: 1 pt, 9-16: 0 pts
 * 1 Kill = 1.0 Point
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
 * BMPS 15-Point System (Krafton BGMI Pro Series / SUPER format)
 * 1st: 15 pts, 2nd: 12 pts, 3rd: 10 pts, 4th: 8 pts, 5th: 6 pts, 6th: 4 pts, 7th: 2 pts, 8-12: 1 pt, 13-16: 0 pts
 * 1 Kill = 1.0 Point
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
 * 1st: 20 pts, 2nd: 14 pts, 3rd: 10 pts, 4th: 8 pts, 5th: 7 pts, 6th: 6 pts, 7th: 5 pts, 8th: 4 pts, 9th: 3 pts, 10th: 2 pts, 11-16: 1 pt
 * 1 Kill = 1.0 Point
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

/**
 * Dictionary of all standard scoring presets
 */
export const SCORING_PRESETS: Record<string, ScoringRuleConfig> = {
  BGIS_10: BGIS_10_POINT_SYSTEM,
  BMPS_15: BMPS_15_POINT_SYSTEM,
  PMCO_20: PMCO_20_POINT_SYSTEM,
  // Shorthand aliases for convenience
  BGIS: BGIS_10_POINT_SYSTEM,
  BMPS: BMPS_15_POINT_SYSTEM,
  PMCO: PMCO_20_POINT_SYSTEM,
};

/**
 * Retrieve a scoring preset by key, falling back to BGIS 10-Point if not found
 */
export function getScoringPreset(presetKey: string): ScoringRuleConfig {
  return SCORING_PRESETS[presetKey] || BGIS_10_POINT_SYSTEM;
}

/**
 * Factory to build a validated custom scoring rule config
 */
export function createCustomScoringRule(
  params: Partial<ScoringRuleConfig> & { name: string }
): ScoringRuleConfig {
  return {
    name: params.name,
    placementPoints: params.placementPoints || { ...BGIS_10_POINT_SYSTEM.placementPoints },
    killPointsPerElim: params.killPointsPerElim !== undefined ? params.killPointsPerElim : 1.0,
    wwcdBonus: params.wwcdBonus !== undefined ? params.wwcdBonus : 0.0,
    tieBreakers: params.tieBreakers && params.tieBreakers.length > 0
      ? params.tieBreakers
      : [...BGIS_10_POINT_SYSTEM.tieBreakers],
    allowNegativeScores: params.allowNegativeScores ?? false,
  };
}
