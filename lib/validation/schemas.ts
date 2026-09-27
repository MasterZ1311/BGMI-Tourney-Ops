import { z } from 'zod';

export const TournamentFormatEnum = z.enum([
  'SINGLE_STAGE',
  'GROUP_STAGE',
  'GROUPS_AND_FINALS',
  'QUALIFIERS_AND_FINALS',
  'CUSTOM',
]);

export const TournamentStatusEnum = z.enum([
  'DRAFT',
  'REGISTRATION',
  'CHECK_IN',
  'GROUPS_LOCKED',
  'SCHEDULED',
  'LIVE',
  'RESULTS_REVIEW',
  'COMPLETED',
  'ARCHIVED',
]);

export const TeamVerificationStatusEnum = z.enum(['PENDING', 'VERIFIED', 'REJECTED']);
export const TeamOperationalStatusEnum = z.enum(['ACTIVE', 'DISQUALIFIED', 'WITHDRAWN']);
export const PlayerRoleEnum = z.enum(['CAPTAIN', 'ASSAULTER', 'SNIPER', 'SUPPORT', 'IGL']);

export const GameMapEnum = z.enum(['ERANGEL', 'MIRAMAR', 'SANHOK', 'VIKENDI', 'RONDO']);
export const GamePerspectiveEnum = z.enum(['TPP', 'FPP']);

export const MatchOperationalStatusEnum = z.enum([
  'SCHEDULED',
  'READY',
  'OPEN',
  'LIVE',
  'COMPLETED',
  'VERIFIED',
  'PUBLISHED',
  'CANCELLED',
]);

export const ResultLifecycleStatusEnum = z.enum([
  'DRAFT',
  'SUBMITTED',
  'VERIFIED',
  'PUBLISHED',
]);

export const RoomOperationalStatusEnum = z.enum([
  'NOT_CREATED',
  'READY',
  'OPEN',
  'LIVE',
  'COMPLETED',
  'CLOSED',
]);

export const AttendanceStatusEnum = z.enum([
  'PRESENT',
  'ABSENT',
  'LATE',
  'DISQUALIFIED',
  'WITHDRAWN',
]);

export const PenaltyStatusEnum = z.enum(['ACTIVE', 'VOIDED']);

export const DisputeCategoryEnum = z.enum([
  'SCORING',
  'ROSTER',
  'BEHAVIOR',
  'TECHNICAL',
]);

export const DisputeStatusEnum = z.enum([
  'OPEN',
  'UNDER_REVIEW',
  'ACCEPTED',
  'REJECTED',
  'RESOLVED',
]);

export const TieBreakerCriterionEnum = z.enum([
  'WWCD',
  'PLACEMENT_POINTS',
  'KILL_POINTS',
  'BEST_MATCH',
  'LAST_MATCH',
]);

// -------------------------------------------------------------
// Tournament Schemas
// -------------------------------------------------------------

export const TournamentSettingsSchema = z.object({
  totalTeamsCap: z.number().int().min(2).max(128).default(64),
  squadSize: z.number().int().min(1).max(6).default(4),
  substitutesCap: z.number().int().min(0).max(4).default(2),
  maxTeamsPerGroup: z.number().int().min(2).max(32).default(16),
  matchDurationMinutes: z.number().int().min(10).max(90).default(30),
  breakDurationMinutes: z.number().int().min(0).max(60).default(15),
  noShowGraceMinutes: z.number().int().min(0).max(30).default(10),
  disputeWindowMinutes: z.number().int().min(0).max(60).default(15),
  allowSubstitutions: z.boolean().default(true),
  rulesMarkdown: z.string().max(10000).optional(),
});

export const ScoringRuleSchema = z.object({
  name: z.string().min(2).max(100).default('Official BGIS 10-Point System'),
  placementPoints: z.record(z.string(), z.number()),
  killPointsPerElim: z.number().min(0).default(1.0),
  wwcdBonus: z.number().min(0).default(0.0),
  tieBreakers: z.array(TieBreakerCriterionEnum).default([
    'WWCD',
    'PLACEMENT_POINTS',
    'KILL_POINTS',
    'BEST_MATCH',
    'LAST_MATCH',
  ]),
});

export const TournamentCreateSchema = z.object({
  name: z.string().min(3, 'Tournament name must be at least 3 characters').max(100),
  organizer: z.string().min(2, 'Organizer name is required').max(100),
  description: z.string().max(2000).optional(),
  format: TournamentFormatEnum.default('GROUP_STAGE'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  venue: z.string().max(200).optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  settings: TournamentSettingsSchema.optional(),
  scoringRule: ScoringRuleSchema.optional(),
});

export const TournamentUpdateSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  organizer: z.string().min(2).max(100).optional(),
  description: z.string().max(2000).optional().nullable(),
  format: TournamentFormatEnum.optional(),
  status: TournamentStatusEnum.optional(),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional(),
  venue: z.string().max(200).optional().nullable(),
  contactEmail: z.string().email().optional().or(z.literal('')).nullable(),
  reason: z.string().max(500).optional(),
});

export const TournamentFinalizeSchema = z.object({
  confirmedBy: z.string().max(100).optional(),
});

// -------------------------------------------------------------
// Team & Roster Schemas
// -------------------------------------------------------------

export const PlayerSchema = z.object({
  name: z.string().min(1, 'Player name is required').max(50),
  ign: z.string().min(1, 'In-game name is required').max(50),
  characterId: z.string().min(5, 'Character ID must be at least 5 digits').max(15).regex(/^\d+$/, 'Character ID must be numeric'),
  role: PlayerRoleEnum.default('ASSAULTER'),
  isSubstitute: z.boolean().default(false),
  isVerified: z.boolean().default(true),
});

export const TeamCreateSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters').max(50),
  tag: z.string().min(2, 'Tag must be at least 2 characters').max(6, 'Tag must be at most 6 characters'),
  logoUrl: z.string().url().optional().or(z.literal('')).nullable(),
  captainName: z.string().max(50).optional().nullable(),
  captainPhone: z.string().max(20).optional().nullable(),
  captainEmail: z.string().email().optional().or(z.literal('')).nullable(),
  groupId: z.string().optional().nullable(),
  players: z.array(PlayerSchema).optional(),
});

export const TeamUpdateSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  tag: z.string().min(2).max(6).optional(),
  logoUrl: z.string().url().optional().or(z.literal('')).nullable(),
  captainName: z.string().max(50).optional().nullable(),
  captainPhone: z.string().max(20).optional().nullable(),
  captainEmail: z.string().email().optional().or(z.literal('')).nullable(),
  groupId: z.string().optional().nullable(),
  verificationStatus: TeamVerificationStatusEnum.optional(),
  status: TeamOperationalStatusEnum.optional(),
  reason: z.string().max(500).optional(),
});

export const TeamImportRowSchema = z.object({
  teamName: z.string().min(1, 'Team name is required'),
  tag: z.string().min(1, 'Team tag is required'),
  captainName: z.string().optional(),
  p1Name: z.string().optional(),
  p1Ign: z.string().min(1, 'Player 1 IGN is required'),
  p1Id: z.string().min(5, 'Player 1 UID is required'),
  p2Name: z.string().optional(),
  p2Ign: z.string().min(1, 'Player 2 IGN is required'),
  p2Id: z.string().min(5, 'Player 2 UID is required'),
  p3Name: z.string().optional(),
  p3Ign: z.string().min(1, 'Player 3 IGN is required'),
  p3Id: z.string().min(5, 'Player 3 UID is required'),
  p4Name: z.string().optional(),
  p4Ign: z.string().min(1, 'Player 4 IGN is required'),
  p4Id: z.string().min(5, 'Player 4 UID is required'),
  subIgn: z.string().optional(),
  subId: z.string().optional(),
});

export const TeamBulkImportSchema = z.object({
  rows: z.array(TeamImportRowSchema).min(1, 'At least one team row must be provided'),
  dryRun: z.boolean().default(false),
});

// -------------------------------------------------------------
// Group Schemas
// -------------------------------------------------------------

export const GroupCreateSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(50),
});

export const GroupUpdateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  isLocked: z.boolean().optional(),
  addTeamId: z.string().optional(),
  removeTeamId: z.string().optional(),
});

export const GroupLockSchema = z.object({
  isLocked: z.boolean().default(true),
});

export const GroupRandomizeSchema = z.object({
  seed: z.number().int().optional(),
});

// -------------------------------------------------------------
// Match & Schedule Schemas
// -------------------------------------------------------------

export const MatchCreateSchema = z.object({
  matchNumber: z.number().int().min(1).optional(),
  title: z.string().max(100).optional(),
  map: GameMapEnum.default('ERANGEL'),
  perspective: GamePerspectiveEnum.default('TPP'),
  scheduledStartTime: z.string().or(z.date()).optional(),
  groupId: z.string().optional().nullable(),
  roomName: z.string().max(100).optional(),
});

export const MatchBatchScheduleSchema = z.object({
  generateBatch: z.literal(true),
  matchCount: z.number().int().min(1).max(30).default(4),
  startTime: z.string().or(z.date()).optional(),
  matchDurationMinutes: z.number().int().min(10).max(90).default(30),
  breakDurationMinutes: z.number().int().min(0).max(60).default(15),
  maps: z.array(GameMapEnum).default(['ERANGEL', 'MIRAMAR', 'SANHOK', 'VIKENDI']),
  groupIds: z.array(z.string()).optional(),
});

export const MatchUpdateSchema = z.object({
  status: MatchOperationalStatusEnum.optional(),
  resultStatus: ResultLifecycleStatusEnum.optional(),
  title: z.string().max(100).optional(),
  map: GameMapEnum.optional(),
  perspective: GamePerspectiveEnum.optional(),
  scheduledStartTime: z.string().or(z.date()).optional(),
  reason: z.string().max(500).optional(),
  adminOverride: z.boolean().optional(),
  overrideReason: z.string().max(500).optional(),
});

// -------------------------------------------------------------
// Room Schemas
// -------------------------------------------------------------

export const RoomUpdateSchema = z.object({
  roomId: z.string().max(50).optional().nullable(),
  password: z.string().max(50).optional().nullable(),
  status: RoomOperationalStatusEnum.optional(),
});

// -------------------------------------------------------------
// Results & Score Submission Schemas
// -------------------------------------------------------------

export const MatchScoreEntrySchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  placement: z.number().int().min(1, 'Placement must be at least 1').max(32, 'Placement cannot exceed 32'),
  kills: z.number().int().min(0, 'Kills cannot be negative').max(100, 'Kills cannot exceed 100'),
  bonusPoints: z.number().min(0, 'Bonus points cannot be negative').default(0),
  penaltyPoints: z.number().min(0, 'Penalty points cannot be negative').default(0),
  notes: z.string().max(500).optional().nullable(),
});

export const MatchResultSubmissionSchema = z.object({
  resultStatus: ResultLifecycleStatusEnum.default('SUBMITTED'),
  scores: z.array(MatchScoreEntrySchema).min(1, 'At least 1 team score must be submitted'),
  adminOverride: z.boolean().optional(),
  overrideReason: z.string().max(500).optional(),
});

export const MatchVerifySchema = z.object({
  verifiedBy: z.string().max(100).optional(),
});

export const MatchPublishSchema = z.object({
  publishedBy: z.string().max(100).optional(),
});

// -------------------------------------------------------------
// Attendance Schemas
// -------------------------------------------------------------

export const AttendanceMarkSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  matchId: z.string().optional().nullable(),
  status: AttendanceStatusEnum,
  checkedInBy: z.string().max(100).optional(),
});

export const AttendanceBulkMarkSchema = z.object({
  bulkMarkAllPresent: z.literal(true),
  checkedInBy: z.string().max(100).optional(),
});

// -------------------------------------------------------------
// Penalty Schemas
// -------------------------------------------------------------

export const PenaltyCreateSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  matchId: z.string().optional().nullable(),
  pointsDeducted: z.number().positive('Deduction must be a positive number').max(100, 'Max penalty is 100 points'),
  reason: z.string().min(3, 'Reason must be at least 3 characters').max(500),
  evidenceUrl: z.string().url().optional().or(z.literal('')).nullable(),
});

export const PenaltyVoidSchema = z.object({
  reason: z.string().max(500).optional(),
  status: PenaltyStatusEnum.optional(),
});

// -------------------------------------------------------------
// Dispute Schemas
// -------------------------------------------------------------

export const DisputeCreateSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  matchId: z.string().optional().nullable(),
  category: DisputeCategoryEnum.default('SCORING'),
  description: z.string().min(5, 'Description must be at least 5 characters').max(1000),
  evidenceUrl: z.string().url().optional().or(z.literal('')).nullable(),
});

export const DisputeUpdateSchema = z.object({
  status: DisputeStatusEnum.optional(),
  resolutionNotes: z.string().max(1000).optional().nullable(),
  resolvedBy: z.string().max(100).optional().nullable(),
});
