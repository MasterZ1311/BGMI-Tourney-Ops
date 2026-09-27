/**
 * BGMI Tournament Control Center — Operations Domain Types
 * Defines contracts, states, DTOs, and event envelopes for live match-day operations.
 */

// ---------------------------------------------------------------------------
// 1. Attendance Types
// ---------------------------------------------------------------------------

export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'DISQUALIFIED'
  | 'WITHDRAWN';

export interface AttendanceRecord {
  id: string;
  tournamentId: string;
  teamId: string;
  matchId?: string | null;
  status: AttendanceStatus;
  checkedInBy?: string | null;
  timestamp: string | Date;
  team?: {
    id: string;
    name: string;
    tag: string;
    status?: 'ACTIVE' | 'DISQUALIFIED' | 'WITHDRAWN';
    verificationStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  };
}

export interface RecordAttendanceInput {
  tournamentId: string;
  teamId: string;
  matchId?: string | null;
  status: AttendanceStatus;
  operatorUserId?: string | null;
  timestamp?: string | Date;
  teamStatus?: 'ACTIVE' | 'DISQUALIFIED' | 'WITHDRAWN';
  teamVerificationStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export interface BulkCheckInTeamInput {
  id: string;
  name: string;
  tag: string;
  status: 'ACTIVE' | 'DISQUALIFIED' | 'WITHDRAWN';
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export interface BulkCheckInInput {
  tournamentId: string;
  matchId?: string | null;
  teams: BulkCheckInTeamInput[];
  operatorUserId?: string | null;
  timestamp?: string | Date;
}

export interface BulkCheckInResult {
  tournamentId: string;
  matchId?: string | null;
  totalTeams: number;
  checkedInCount: number;
  skippedCount: number;
  records: AttendanceRecord[];
  skippedDetails: Array<{
    teamId: string;
    teamName: string;
    reason: string;
  }>;
}

export interface AttendanceSummary {
  tournamentId: string;
  matchId?: string | null;
  totalTeams: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  withdrawnCount: number;
  disqualifiedCount: number;
  readinessPercentage: number;
  isReadyForMatch: boolean;
  missingTeams: Array<{ id: string; name?: string; tag?: string }>;
}

export interface NoShowEvaluation {
  isNoShow: boolean;
  gracePeriodMinutes: number;
  scheduledTime: Date;
  elapsedMinutes: number;
  exceededByMinutes: number;
}

// ---------------------------------------------------------------------------
// 2. Custom Room Types
// ---------------------------------------------------------------------------

export type RoomOperationalStatus =
  | 'NOT_CREATED'
  | 'READY'
  | 'OPEN'
  | 'LIVE'
  | 'COMPLETED'
  | 'CLOSED';

export interface RoomEntity {
  id: string;
  matchId: string;
  roomName: string;
  roomId?: string | null;
  password?: string | null;
  status: RoomOperationalStatus;
  updatedAt: string | Date;
}

export interface RoomUpdateInput {
  roomId?: string | null;
  password?: string | null;
  roomName?: string;
  status?: RoomOperationalStatus;
}

export interface MaskedRoomEntity {
  id: string;
  matchId: string;
  roomName: string;
  roomId?: string | null;
  password: string | null;
  status: RoomOperationalStatus;
  isMasked: boolean;
  updatedAt: string | Date;
}

export interface RoomConflictCheckItem {
  matchId: string;
  scheduledStartTime: string | Date;
  durationMinutes: number;
  roomId?: string | null;
}

export interface RoomConflictCheckResult {
  hasConflict: boolean;
  conflicts: string[];
}

// ---------------------------------------------------------------------------
// 3. Match Execution Pipeline Types
// ---------------------------------------------------------------------------

export type MatchOperationalStatus =
  | 'SCHEDULED'
  | 'READY'
  | 'OPEN'
  | 'LIVE'
  | 'COMPLETED'
  | 'VERIFIED'
  | 'PUBLISHED'
  | 'CANCELLED';

export interface MatchEntity {
  id: string;
  tournamentId: string;
  groupId?: string | null;
  matchNumber: number;
  title: string;
  map: 'ERANGEL' | 'MIRAMAR' | 'SANHOK' | 'VIKENDI';
  perspective: 'TPP' | 'FPP';
  scheduledStartTime: string | Date;
  actualStartTime?: string | Date | null;
  actualEndTime?: string | Date | null;
  status: MatchOperationalStatus;
  resultStatus: ResultLifecycleStatus;
  room?: RoomEntity | null;
}

export interface MatchSlotAssignment {
  teamId: string;
  teamName: string;
  slotNumber: number; // 1 - 25
  isAttendanceVerified?: boolean;
}

export interface PreMatchChecklist {
  matchId: string;
  allSlotsAssigned: boolean;
  totalSlottedTeams: number;
  minimumSquadsPresent: boolean;
  roomCreated: boolean;
  roomCredentialsSet: boolean;
  attendanceVerified: boolean;
  canStart: boolean;
  blockers: string[];
  warnings: string[];
}

export interface MatchTransitionResult {
  success: boolean;
  previousStatus: MatchOperationalStatus;
  currentStatus: MatchOperationalStatus;
  match: MatchEntity;
  message?: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// 4. Result Verification Workflow Types
// ---------------------------------------------------------------------------

export type ResultLifecycleStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'VERIFIED'
  | 'PUBLISHED';

export interface TeamScoreEntryInput {
  teamId: string;
  placement: number;
  kills: number;
  bonusPoints?: number;
  penaltyPoints?: number;
  notes?: string;
}

export interface ResultSubmissionPayload {
  matchId: string;
  scores: TeamScoreEntryInput[];
  submittedBy?: string;
  submissionNotes?: string;
}

export interface ScoreValidationIssue {
  field?: string;
  teamId?: string;
  message: string;
  severity: 'ERROR' | 'WARNING';
}

export interface ResultVerificationAudit {
  matchId: string;
  currentLifecycleStatus: ResultLifecycleStatus;
  isValid: boolean;
  issues: ScoreValidationIssue[];
  placementSequenceValid: boolean;
  wwcdCountValid: boolean;
  killCountsValid: boolean;
  allSlottedTeamsReported: boolean;
  hasOpenDisputes: boolean;
  openDisputeCount: number;
}

export interface PublishedScoreOverrideInput {
  matchId: string;
  scores: TeamScoreEntryInput[];
  reason: string;
  operatorUserId: string;
  operatorRole: string; // Must be SUPER_ADMIN or TOURNAMENT_ADMIN
}

// ---------------------------------------------------------------------------
// 5. Penalties & Disputes Types
// ---------------------------------------------------------------------------

export type PenaltyStatus = 'ACTIVE' | 'VOIDED';

export interface PenaltyRecord {
  id: string;
  tournamentId: string;
  teamId: string;
  matchId?: string | null;
  pointsDeducted: number;
  reason: string;
  evidenceUrl?: string | null;
  status: PenaltyStatus;
  issuedBy: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  voidReason?: string | null;
  voidedBy?: string | null;
}

export interface CreatePenaltyInput {
  tournamentId: string;
  teamId: string;
  matchId?: string | null;
  pointsDeducted: number;
  reason: string;
  evidenceUrl?: string | null;
  issuedBy: string;
}

export type DisputeCategory =
  | 'SCORING'
  | 'ROSTER'
  | 'BEHAVIOR'
  | 'TECHNICAL';

export type DisputeStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'RESOLVED';

export interface DisputeRecord {
  id: string;
  tournamentId: string;
  teamId: string;
  matchId?: string | null;
  category: DisputeCategory;
  description: string;
  evidenceUrl?: string | null;
  status: DisputeStatus;
  resolutionNotes?: string | null;
  resolvedBy?: string | null;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface CreateDisputeInput {
  tournamentId: string;
  teamId: string;
  matchId?: string | null;
  category: DisputeCategory;
  description: string;
  evidenceUrl?: string | null;
}

export interface AdjudicateDisputeInput {
  disputeId: string;
  action: 'ACCEPT' | 'REJECT' | 'RESOLVE' | 'REVIEW';
  resolutionNotes: string;
  resolvedBy: string;
}

// ---------------------------------------------------------------------------
// 6. Provider-Neutral Domain Events
// ---------------------------------------------------------------------------

export type DomainEventTopic =
  // Match events
  | 'match.scheduled'
  | 'match.ready'
  | 'match.room_opened'
  | 'match.starting'
  | 'match.live'
  | 'match.ended'
  | 'match.cancelled'
  // Attendance events
  | 'team.checked_in'
  | 'team.absent'
  | 'team.late'
  | 'team.withdrawn'
  | 'team.disqualified'
  | 'attendance.bulk_completed'
  // Room events
  | 'room.created'
  | 'room.credentials_updated'
  | 'room.opened'
  | 'room.closed'
  // Result workflow events
  | 'result.draft_saved'
  | 'result.submitted'
  | 'result.rejected'
  | 'result.correction_requested'
  | 'result.verified'
  | 'result.published'
  | 'result.overridden'
  // Penalty & Dispute events
  | 'penalty.issued'
  | 'penalty.voided'
  | 'dispute.created'
  | 'dispute.status_updated'
  | 'dispute.resolved';

export interface DomainEventEnvelope<T = unknown> {
  id: string;
  topic: DomainEventTopic;
  aggregateId: string;
  aggregateType: 'MATCH' | 'TEAM' | 'TOURNAMENT' | 'ROOM' | 'RESULT' | 'PENALTY' | 'DISPUTE';
  timestamp: string; // ISO 8601
  payload: T;
  actorUserId?: string | null;
  version: number;
}

export type DomainEventHandler<T = unknown> = (
  event: DomainEventEnvelope<T>
) => void | Promise<void>;
