# BGMI Tournament Organizer Platform — Shared Types Contract

## 1. Executive Summary & Purpose

This contract establishes the single source of truth for **domain interfaces, enums, discriminated unions, and shared data transfer objects (DTOs)** across all agents.

All agents (Frontend, Backend, Database, Scoring, Tournament, Operations, Security, QA) must align with the types defined herein to ensure seamless inter-module communication.

---

## 2. TypeScript Conventions & Guidelines

1. **Strict Type Safety**: `noImplicitAny: true`, `strict: true`. No usage of `any` except where explicitly unavoidable in generic meta wrappers.
2. **Interface vs. Type**:
   - Use `interface` for entity data models and extensible contracts.
   - Use `type` for unions, primitive aliases, and discriminated union variants.
3. **Naming Standards**:
   - Types & Interfaces: `PascalCase` (e.g. `TeamMatchScore`, `ScoringRuleConfig`).
   - Enums / Literal Union Values: `UPPER_SNAKE_CASE` (e.g. `MATCH_ADMIN`, `RESULTS_REVIEW`).
   - Object Keys & Properties: `camelCase` (e.g. `killPointsPerElim`, `scheduledStartTime`).

---

## 3. Core Domain Models & Enums

### 3.1. Tournament & Configuration
```typescript
export type TournamentFormat =
  | 'SINGLE_STAGE'
  | 'GROUP_STAGE'
  | 'GROUPS_AND_FINALS'
  | 'QUALIFIERS_AND_FINALS'
  | 'CUSTOM';

export type TournamentStatus =
  | 'DRAFT'
  | 'REGISTRATION'
  | 'CHECK_IN'
  | 'GROUPS_LOCKED'
  | 'SCHEDULED'
  | 'LIVE'
  | 'RESULTS_REVIEW'
  | 'COMPLETED'
  | 'ARCHIVED';

export interface TournamentEntity {
  id: string;
  name: string;
  organizer: string;
  description?: string | null;
  format: TournamentFormat;
  status: TournamentStatus;
  startDate: string | Date;
  endDate: string | Date;
  venue?: string | null;
  contactEmail?: string | null;
  isFinalized: boolean;
  finalizedAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface TournamentSettingsEntity {
  id: string;
  tournamentId: string;
  totalTeamsCap: number;
  squadSize: number;
  substitutesCap: number;
  maxTeamsPerGroup: number;
  matchDurationMinutes: number;
  breakDurationMinutes: number;
  noShowGraceMinutes: number;
  disputeWindowMinutes: number;
  allowSubstitutions: boolean;
  rulesMarkdown?: string | null;
}
```

### 3.2. Teams, Rosters & Attendance
```typescript
export type TeamVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type TeamOperationalStatus = 'ACTIVE' | 'DISQUALIFIED' | 'WITHDRAWN';
export type PlayerRole = 'CAPTAIN' | 'ASSAULTER' | 'SNIPER' | 'SUPPORT' | 'IGL';

export interface PlayerEntity {
  id: string;
  teamId: string;
  name: string;
  ign: string;             // In-Game Name (e.g. "SoulMortal")
  characterId: string;     // BGMI Numeric UID (e.g. "5123456789")
  role: PlayerRole;
  isSubstitute: boolean;
  isVerified: boolean;
}

export interface TeamEntity {
  id: string;
  tournamentId: string;
  groupId?: string | null;
  name: string;
  tag: string;             // 3-5 char squad tag
  logoUrl?: string | null;
  captainName?: string | null;
  captainPhone?: string | null;
  captainEmail?: string | null;
  verificationStatus: TeamVerificationStatus;
  status: TeamOperationalStatus;
  players?: PlayerEntity[];
}

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
  team?: Pick<TeamEntity, 'id' | 'name' | 'tag'>;
}
```

### 3.3. Matches, Rooms & Maps
```typescript
export type GameMap = 'ERANGEL' | 'MIRAMAR' | 'SANHOK' | 'VIKENDI';
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
  password?: string | null; // Masked on public / observer views
  status: RoomOperationalStatus;
  updatedAt: string | Date;
}

export interface MatchEntity {
  id: string;
  tournamentId: string;
  groupId?: string | null;
  matchNumber: number;
  title: string;
  map: GameMap;
  perspective: GamePerspective;
  scheduledStartTime: string | Date;
  actualStartTime?: string | Date | null;
  actualEndTime?: string | Date | null;
  status: MatchOperationalStatus;
  resultStatus: ResultLifecycleStatus;
  room?: RoomEntity | null;
}
```

### 3.4. Scoring Models
```typescript
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
```

### 3.5. Penalties & Disputes
```typescript
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
}

export type DisputeStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'RESOLVED';

export type DisputeCategory =
  | 'SCORING'
  | 'ROSTER'
  | 'BEHAVIOR'
  | 'TECHNICAL';

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
}
```

### 3.6. Roles & Authorization
```typescript
export type UserRole =
  | 'SUPER_ADMIN'
  | 'TOURNAMENT_ADMIN'
  | 'MATCH_ADMIN'
  | 'SCOREKEEPER'
  | 'OBSERVER';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
```
