/**
 * BGMI Tournament Control Center — Attendance Desk Service
 * Manages squad check-ins, bulk attendance, no-show evaluation, and attendance readiness metrics.
 */

import {
  AttendanceRecord,
  AttendanceStatus,
  AttendanceSummary,
  BulkCheckInInput,
  BulkCheckInResult,
  NoShowEvaluation,
  RecordAttendanceInput,
} from './types';
import { domainEventBus } from './events';

/**
 * Validate whether a squad is eligible to transition to the requested attendance state.
 * Enforces rule: Disqualified or Withdrawn squads cannot be checked in as PRESENT or LATE.
 */
export function validateAttendanceTransition(
  currentStatus: AttendanceStatus | undefined,
  targetStatus: AttendanceStatus,
  teamOperationalStatus: 'ACTIVE' | 'DISQUALIFIED' | 'WITHDRAWN' = 'ACTIVE',
  teamVerificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' = 'VERIFIED'
): { valid: boolean; reason?: string } {
  // Disqualified teams cannot check in
  if (teamOperationalStatus === 'DISQUALIFIED' && (targetStatus === 'PRESENT' || targetStatus === 'LATE')) {
    return {
      valid: false,
      reason: 'Team is DISQUALIFIED and cannot be checked in to the match lobby.',
    };
  }

  // Withdrawn teams cannot check in
  if (teamOperationalStatus === 'WITHDRAWN' && (targetStatus === 'PRESENT' || targetStatus === 'LATE')) {
    return {
      valid: false,
      reason: 'Team has WITHDRAWN from the tournament and cannot be checked in.',
    };
  }

  // Unverified or rejected rosters
  if (teamVerificationStatus === 'REJECTED' && (targetStatus === 'PRESENT' || targetStatus === 'LATE')) {
    return {
      valid: false,
      reason: 'Team roster has been REJECTED during verification.',
    };
  }

  // If current attendance was already DISQUALIFIED in this match, require explicit admin reset
  if (currentStatus === 'DISQUALIFIED' && (targetStatus === 'PRESENT' || targetStatus === 'LATE')) {
    return {
      valid: false,
      reason: 'Team was already marked DISQUALIFIED for this match. Operational override required.',
    };
  }

  return { valid: true };
}

/**
 * Record or update a single squad's match-day attendance.
 * Emits provider-neutral domain events upon successful check-in.
 */
export function recordAttendance(
  input: RecordAttendanceInput,
  currentStatus?: AttendanceStatus
): {
  success: boolean;
  record?: AttendanceRecord;
  error?: string;
} {
  const teamStatus = input.teamStatus ?? 'ACTIVE';
  const teamVerification = input.teamVerificationStatus ?? 'VERIFIED';

  const validation = validateAttendanceTransition(
    currentStatus,
    input.status,
    teamStatus,
    teamVerification
  );

  if (!validation.valid) {
    return {
      success: false,
      error: validation.reason,
    };
  }

  const record: AttendanceRecord = {
    id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    tournamentId: input.tournamentId,
    teamId: input.teamId,
    matchId: input.matchId ?? null,
    status: input.status,
    checkedInBy: input.operatorUserId ?? null,
    timestamp: input.timestamp ? new Date(input.timestamp) : new Date(),
  };

  // Dispatch operational event
  const topicMap: Record<AttendanceStatus, any> = {
    PRESENT: 'team.checked_in',
    LATE: 'team.late',
    ABSENT: 'team.absent',
    WITHDRAWN: 'team.withdrawn',
    DISQUALIFIED: 'team.disqualified',
  };

  domainEventBus.emit(
    topicMap[input.status],
    'TEAM',
    input.teamId,
    {
      tournamentId: input.tournamentId,
      matchId: input.matchId ?? null,
      status: input.status,
      timestamp: record.timestamp,
    },
    input.operatorUserId
  );

  return {
    success: true,
    record,
  };
}

/**
 * Execute bulk check-in for an entire lobby of participating squads.
 * Automatically filters out disqualified, withdrawn, or unverified squads.
 */
export function bulkCheckIn(input: BulkCheckInInput): BulkCheckInResult {
  const { tournamentId, matchId, teams, operatorUserId } = input;
  const timestamp = input.timestamp ? new Date(input.timestamp) : new Date();

  const records: AttendanceRecord[] = [];
  const skippedDetails: BulkCheckInResult['skippedDetails'] = [];

  for (const team of teams) {
    if (team.status === 'DISQUALIFIED') {
      skippedDetails.push({
        teamId: team.id,
        teamName: team.name,
        reason: 'Team is DISQUALIFIED',
      });
      continue;
    }

    if (team.status === 'WITHDRAWN') {
      skippedDetails.push({
        teamId: team.id,
        teamName: team.name,
        reason: 'Team has WITHDRAWN',
      });
      continue;
    }

    if (team.verificationStatus !== 'VERIFIED') {
      skippedDetails.push({
        teamId: team.id,
        teamName: team.name,
        reason: `Roster verification status is ${team.verificationStatus}`,
      });
      continue;
    }

    const rec: AttendanceRecord = {
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      tournamentId,
      teamId: team.id,
      matchId: matchId ?? null,
      status: 'PRESENT',
      checkedInBy: operatorUserId ?? 'Lobby Admin',
      timestamp,
      team: {
        id: team.id,
        name: team.name,
        tag: team.tag,
        status: team.status,
        verificationStatus: team.verificationStatus,
      },
    };

    records.push(rec);
  }

  // Emit summary bulk completed event
  domainEventBus.emit(
    'attendance.bulk_completed',
    'TOURNAMENT',
    tournamentId,
    {
      matchId: matchId ?? null,
      totalTeams: teams.length,
      checkedInCount: records.length,
      skippedCount: skippedDetails.length,
      timestamp: timestamp.toISOString(),
    },
    operatorUserId
  );

  return {
    tournamentId,
    matchId: matchId ?? null,
    totalTeams: teams.length,
    checkedInCount: records.length,
    skippedCount: skippedDetails.length,
    records,
    skippedDetails,
  };
}

/**
 * Calculate attendance metrics, readiness percentage, and identify missing squads.
 */
export function getAttendanceSummary(
  records: AttendanceRecord[],
  totalTeamsCap: number,
  allTeams: Array<{ id: string; name?: string; tag?: string; status?: string }> = []
): AttendanceSummary {
  // Use map to keep latest state per teamId in case of multiple records
  const latestByTeam = new Map<string, AttendanceRecord>();
  for (const r of records) {
    const existing = latestByTeam.get(r.teamId);
    if (!existing || new Date(r.timestamp).getTime() > new Date(existing.timestamp).getTime()) {
      latestByTeam.set(r.teamId, r);
    }
  }

  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let withdrawnCount = 0;
  let disqualifiedCount = 0;

  for (const r of latestByTeam.values()) {
    switch (r.status) {
      case 'PRESENT':
        presentCount++;
        break;
      case 'ABSENT':
        absentCount++;
        break;
      case 'LATE':
        lateCount++;
        break;
      case 'WITHDRAWN':
        withdrawnCount++;
        break;
      case 'DISQUALIFIED':
        disqualifiedCount++;
        break;
    }
  }

  const denominator = Math.max(totalTeamsCap, allTeams.length, 1);
  const checkedInSum = presentCount + lateCount;
  const readinessPercentage = Math.min(100, Math.round((checkedInSum / denominator) * 100));

  // Determine missing teams
  const missingTeams: Array<{ id: string; name?: string; tag?: string }> = [];
  for (const team of allTeams) {
    const rec = latestByTeam.get(team.id);
    if (!rec || rec.status === 'ABSENT') {
      missingTeams.push({
        id: team.id,
        name: team.name,
        tag: team.tag,
      });
    }
  }

  const isReadyForMatch = readinessPercentage >= 100 || (missingTeams.length === 0 && checkedInSum >= 2);

  return {
    tournamentId: records[0]?.tournamentId ?? '',
    matchId: records[0]?.matchId ?? null,
    totalTeams: denominator,
    presentCount,
    absentCount,
    lateCount,
    withdrawnCount,
    disqualifiedCount,
    readinessPercentage,
    isReadyForMatch,
    missingTeams,
  };
}

/**
 * Evaluate if an absent squad has exceeded the no-show grace period window.
 */
export function evaluateNoShow(
  scheduledStartTime: Date | string,
  gracePeriodMinutes = 10,
  currentTime: Date | string = new Date()
): NoShowEvaluation {
  const scheduledMs = new Date(scheduledStartTime).getTime();
  const currentMs = new Date(currentTime).getTime();
  const elapsedMinutes = Math.floor((currentMs - scheduledMs) / (60 * 1000));
  const exceededByMinutes = Math.max(0, elapsedMinutes - gracePeriodMinutes);
  const isNoShow = elapsedMinutes > gracePeriodMinutes;

  return {
    isNoShow,
    gracePeriodMinutes,
    scheduledTime: new Date(scheduledStartTime),
    elapsedMinutes,
    exceededByMinutes,
  };
}
