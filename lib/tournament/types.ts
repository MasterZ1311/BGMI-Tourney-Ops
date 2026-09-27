export type TournamentStage =
  | 'DRAFT'
  | 'REGISTRATION'
  | 'CHECK_IN'
  | 'GROUPS_LOCKED'
  | 'SCHEDULED'
  | 'LIVE'
  | 'RESULTS_REVIEW'
  | 'COMPLETED'
  | 'ARCHIVED';

export type GameMapName = 'ERANGEL' | 'MIRAMAR' | 'SANHOK' | 'VIKENDI';

export interface GroupGenerationOptions {
  tournamentId: string;
  groupCount: number;
  teams: Array<{ id: string; name: string }>;
  seed?: number;
}

export interface ScheduleGenerationOptions {
  tournamentId: string;
  matchCount: number;
  startTime: Date;
  matchDurationMinutes: number;
  breakDurationMinutes: number;
  maps: GameMapName[];
  groupIds?: string[];
}

export interface GeneratedMatchSlot {
  matchNumber: number;
  title: string;
  map: GameMapName;
  perspective: 'TPP' | 'FPP';
  scheduledStartTime: Date;
  groupId?: string;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflicts: string[];
}

export interface FinalizationCheckItem {
  id: string;
  label: string;
  passed: boolean;
  details: string;
}

export interface FinalizationAuditResult {
  canFinalize: boolean;
  checklist: FinalizationCheckItem[];
}
