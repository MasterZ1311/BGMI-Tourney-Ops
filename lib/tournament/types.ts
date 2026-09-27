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

export type TournamentStatus = TournamentStage;

export type GameMapName = 'ERANGEL' | 'MIRAMAR' | 'SANHOK' | 'VIKENDI' | 'RONDO';
export type GameMap = GameMapName;

export type GamePerspective = 'TPP' | 'FPP';

export type MatchOperationalStatus =
  | 'SCHEDULED'
  | 'READY'
  | 'OPEN'
  | 'LIVE'
  | 'COMPLETED'
  | 'VERIFIED'
  | 'PUBLISHED'
  | 'CANCELLED';

export type ResultLifecycleStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'VERIFIED'
  | 'PUBLISHED';

export interface GroupInfo {
  id?: string;
  name?: string;
  isLocked?: boolean;
}

export interface GroupGenerationOptions {
  tournamentId: string;
  groupCount: number;
  teams: Array<{ id: string; name: string }>;
  seed?: number;
  isLocked?: boolean;
  groups?: GroupInfo[];
}

export interface BalancedGroup {
  groupIndex: number;
  groupId?: string;
  name: string;
  teams: Array<{ id: string; name: string }>;
  teamIds: string[];
}

export interface ScheduleGenerationOptions {
  tournamentId: string;
  matchCount: number;
  startTime: Date;
  matchDurationMinutes: number;
  breakDurationMinutes: number;
  maps?: GameMapName[];
  groupIds?: string[];
  perspective?: GamePerspective;
}

export interface GeneratedMatchSlot {
  matchNumber: number;
  title: string;
  map: GameMapName;
  perspective: GamePerspective;
  scheduledStartTime: Date;
  groupId?: string;
}

export interface MatchConflictInput {
  id: string;
  matchNumber?: number;
  title?: string;
  scheduledStartTime: Date | string;
  durationMinutes?: number;
  matchDurationMinutes?: number;
  roomId?: string | null;
  room?: { id?: string; roomId?: string | null } | null;
  teamIds?: string[];
  teams?: Array<{ id: string; name?: string }>;
  groupId?: string | null;
}

export interface ConflictCheckOptions {
  checkPastTimes?: boolean;
  now?: Date;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflicts: string[];
}

export interface TournamentTransitionContext {
  registeredTeamsCount?: number;
  verifiedTeamsCount?: number;
  minTeams?: number;
  groupsConfigured?: boolean;
  groupsLocked?: boolean;
  matchesScheduled?: boolean;
  hasInitializedRooms?: boolean;
  allMatchesFinished?: boolean;
  auditResult?: FinalizationAuditResult;
}

export interface StateTransitionResult {
  valid: boolean;
  from: TournamentStatus;
  to: TournamentStatus;
  error?: string;
}

export interface MatchStateTransitionResult {
  valid: boolean;
  from: MatchOperationalStatus;
  to: MatchOperationalStatus;
  error?: string;
}

export interface FinalizationAuditParams {
  totalMatches: number;
  completedMatches: number;
  verifiedResults: number;
  openDisputesCount: number;
  activeTeamsCount: number;
  unconfirmedPenaltiesCount?: number;
  unresolvedTiesCount?: number;
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
