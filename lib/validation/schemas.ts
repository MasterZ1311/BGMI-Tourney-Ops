import { z } from 'zod';

export const TournamentCreateSchema = z.object({
  name: z.string().min(3, 'Tournament name must be at least 3 characters'),
  organizer: z.string().min(2, 'Organizer name is required'),
  description: z.string().optional(),
  format: z.enum([
    'SINGLE_STAGE',
    'GROUP_STAGE',
    'GROUPS_AND_FINALS',
    'QUALIFIERS_AND_FINALS',
    'CUSTOM',
  ]).default('GROUP_STAGE'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  venue: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  settings: z.object({
    totalTeamsCap: z.number().int().min(2).max(128).default(64),
    squadSize: z.number().int().min(1).max(6).default(4),
    substitutesCap: z.number().int().min(0).max(4).default(2),
    maxTeamsPerGroup: z.number().int().min(2).max(32).default(16),
    matchDurationMinutes: z.number().int().min(10).max(90).default(30),
    breakDurationMinutes: z.number().int().min(0).max(60).default(15),
    noShowGraceMinutes: z.number().int().min(0).max(30).default(10),
    disputeWindowMinutes: z.number().int().min(0).max(60).default(15),
    allowSubstitutions: z.boolean().default(true),
    rulesMarkdown: z.string().optional(),
  }).optional(),
  scoringRule: z.object({
    name: z.string().default('Official BGIS 10-Point System'),
    placementPoints: z.record(z.string(), z.number()),
    killPointsPerElim: z.number().default(1.0),
    wwcdBonus: z.number().default(0.0),
    tieBreakers: z.array(z.string()).default([
      'WWCD',
      'PLACEMENT_POINTS',
      'KILL_POINTS',
      'BEST_MATCH',
      'LAST_MATCH',
    ]),
  }).optional(),
});

export const TeamCreateSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters'),
  tag: z.string().min(2).max(6, 'Tag must be 2 to 6 characters'),
  logoUrl: z.string().url().optional().or(z.literal('')),
  captainName: z.string().optional(),
  captainPhone: z.string().optional(),
  captainEmail: z.string().email().optional().or(z.literal('')),
  groupId: z.string().optional(),
  players: z.array(
    z.object({
      name: z.string().min(1, 'Player name is required'),
      ign: z.string().min(1, 'In-game name is required'),
      characterId: z.string().min(5, 'Character ID must be at least 5 digits'),
      role: z.enum(['CAPTAIN', 'ASSAULTER', 'SNIPER', 'SUPPORT', 'IGL']).default('ASSAULTER'),
      isSubstitute: z.boolean().default(false),
      isVerified: z.boolean().default(true),
    })
  ).optional(),
});

export const MatchResultSubmissionSchema = z.object({
  resultStatus: z.enum(['DRAFT', 'SUBMITTED', 'VERIFIED', 'PUBLISHED']).default('SUBMITTED'),
  scores: z.array(
    z.object({
      teamId: z.string().min(1, 'Team ID is required'),
      placement: z.number().int().min(1).max(32),
      kills: z.number().int().min(0),
      bonusPoints: z.number().default(0),
      penaltyPoints: z.number().default(0),
      notes: z.string().optional(),
    })
  ).min(1, 'At least 1 team score must be submitted'),
});

export const RoomUpdateSchema = z.object({
  roomId: z.string().optional(),
  password: z.string().optional(),
  status: z.enum(['NOT_CREATED', 'READY', 'OPEN', 'LIVE', 'COMPLETED', 'CLOSED']).optional(),
});

export const PenaltyCreateSchema = z.object({
  teamId: z.string().min(1),
  matchId: z.string().optional(),
  pointsDeducted: z.number().positive('Deduction must be a positive number'),
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
  evidenceUrl: z.string().optional(),
});

export const DisputeCreateSchema = z.object({
  teamId: z.string().min(1),
  matchId: z.string().optional(),
  category: z.string().default('SCORING'),
  description: z.string().min(5, 'Description is required'),
  evidenceUrl: z.string().optional(),
});

export const AttendanceMarkSchema = z.object({
  teamId: z.string().min(1),
  matchId: z.string().optional(),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'DISQUALIFIED', 'WITHDRAWN']),
  checkedInBy: z.string().optional(),
});
