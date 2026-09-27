# BGMI Tournament Control Center — Database Schema Specification

## 1. Overview
The database uses a normalized relational architecture managed via Prisma ORM. It supports SQLite for rapid zero-dependency local development & testing, and is directly compatible with PostgreSQL for enterprise cloud deployments.

## 2. Entity Relationship Overview

```
[User] ──< [AuditLog]
   │
   └──< [Tournament] ──┬──< [TournamentSettings]
                       ├──< [ScoringRule]
                       ├──< [Group] ──< [Team] ──< [Player]
                       ├──< [Attendance]
                       ├──< [Match] ──┬──< [Room]
                       │              ├──< [MatchTeam]
                       │              └──< [TeamMatchScore]
                       ├──< [Penalty]
                       ├──< [Dispute]
                       └──< [Notification]
```

## 3. Data Models Specification

### 3.1 User & Authentication
- `User`:
  - `id`: String (UUID / CUID, Primary Key)
  - `name`: String
  - `email`: String (Unique)
  - `role`: Enum `UserRole` (`SUPER_ADMIN`, `TOURNAMENT_ADMIN`, `MATCH_ADMIN`, `SCOREKEEPER`, `OBSERVER`)
  - `createdAt`: DateTime
  - `updatedAt`: DateTime

### 3.2 Tournament & Configuration
- `Tournament`:
  - `id`: String (Primary Key)
  - `name`: String
  - `organizer`: String
  - `description`: String?
  - `format`: Enum `TournamentFormat` (`SINGLE_STAGE`, `GROUP_STAGE`, `GROUPS_AND_FINALS`, `QUALIFIERS_AND_FINALS`, `CUSTOM`)
  - `status`: Enum `TournamentStatus` (`DRAFT`, `REGISTRATION`, `CHECK_IN`, `GROUPS_LOCKED`, `SCHEDULED`, `LIVE`, `RESULTS_REVIEW`, `COMPLETED`, `ARCHIVED`)
  - `startDate`: DateTime
  - `endDate`: DateTime
  - `venue`: String?
  - `contactEmail`: String?
  - `isFinalized`: Boolean (Default: false)
  - `finalizedAt`: DateTime?
  - `createdAt`, `updatedAt`

- `TournamentSettings`:
  - `id`: String (Primary Key)
  - `tournamentId`: String (Unique, Foreign Key -> `Tournament.id`)
  - `totalTeamsCap`: Int (Default: 64)
  - `squadSize`: Int (Default: 4)
  - `substitutesCap`: Int (Default: 2)
  - `maxTeamsPerGroup`: Int (Default: 16)
  - `matchDurationMinutes`: Int (Default: 30)
  - `breakDurationMinutes`: Int (Default: 15)
  - `noShowGraceMinutes`: Int (Default: 10)
  - `disputeWindowMinutes`: Int (Default: 15)
  - `allowSubstitutions`: Boolean (Default: true)
  - `rulesMarkdown`: String?

### 3.3 Scoring Engine Rules
- `ScoringRule`:
  - `id`: String (Primary Key)
  - `tournamentId`: String (Unique, Foreign Key -> `Tournament.id`)
  - `name`: String (e.g. "Official BGIS 10-Point System", "BMPS 15-Point System")
  - `placementPoints`: String (JSON String storing map: `{"1":10,"2":6,"3":5,"4":4,"5":3,"6":2,"7":1,"8":1,"9":0,...}`)
  - `killPointsPerElim`: Float (Default: 1.0)
  - `wwcdBonus`: Float (Default: 0.0)
  - `tieBreakers`: String (JSON Array storing prioritized criteria, e.g. `["WWCD", "PLACEMENT_POINTS", "KILL_POINTS", "BEST_MATCH", "LAST_MATCH"]`)
  - `createdAt`, `updatedAt`

### 3.4 Teams & Rosters
- `Team`:
  - `id`: String (Primary Key)
  - `tournamentId`: String (Foreign Key -> `Tournament.id`)
  - `groupId`: String? (Foreign Key -> `Group.id`)
  - `name`: String
  - `tag`: String (3-5 characters, e.g. "SOUL", "GODL")
  - `logoUrl`: String?
  - `captainName`: String?
  - `captainPhone`: String?
  - `captainEmail`: String?
  - `verificationStatus`: Enum `VerificationStatus` (`PENDING`, `VERIFIED`, `REJECTED`)
  - `status`: Enum `TeamStatus` (`ACTIVE`, `DISQUALIFIED`, `WITHDRAWN`)
  - `createdAt`, `updatedAt`

- `Player`:
  - `id`: String (Primary Key)
  - `teamId`: String (Foreign Key -> `Team.id`)
  - `name`: String
  - `ign`: String (In-Game Name, e.g. "Mortal", "Jonathan")
  - `characterId`: String (BGMI UID, 8-12 digits)
  - `role`: Enum `PlayerRole` (`CAPTAIN`, `ASSAULTER`, `SNIPER`, `SUPPORT`, `IGL`)
  - `isSubstitute`: Boolean (Default: false)
  - `isVerified`: Boolean (Default: true)
  - `createdAt`, `updatedAt`

### 3.5 Groups
- `Group`:
  - `id`: String (Primary Key)
  - `tournamentId`: String (Foreign Key -> `Tournament.id`)
  - `name`: String (e.g. "Group A", "Group B")
  - `isLocked`: Boolean (Default: false)
  - `createdAt`, `updatedAt`

### 3.6 Matches & Rooms
- `Match`:
  - `id`: String (Primary Key)
  - `tournamentId`: String (Foreign Key -> `Tournament.id`)
  - `groupId`: String? (Foreign Key -> `Group.id`)
  - `matchNumber`: Int
  - `title`: String (e.g. "Match #1 - Group A")
  - `map`: Enum `GameMap` (`ERANGEL`, `MIRAMAR`, `SANHOK`, `VIKENDI`)
  - `perspective`: Enum `GamePerspective` (`TPP`, `FPP`)
  - `scheduledStartTime`: DateTime
  - `actualStartTime`: DateTime?
  - `actualEndTime`: DateTime?
  - `status`: Enum `MatchStatus` (`SCHEDULED`, `READY`, `OPEN`, `LIVE`, `COMPLETED`, `VERIFIED`, `PUBLISHED`, `CANCELLED`)
  - `resultStatus`: Enum `ResultVerificationStatus` (`DRAFT`, `SUBMITTED`, `VERIFIED`, `PUBLISHED`)
  - `createdAt`, `updatedAt`

- `Room`:
  - `id`: String (Primary Key)
  - `matchId`: String (Unique, Foreign Key -> `Match.id`)
  - `roomName`: String
  - `roomId`: String? (In-Game Lobby ID)
  - `password`: String? (In-Game Lobby Password)
  - `status`: Enum `RoomStatus` (`NOT_CREATED`, `READY`, `OPEN`, `LIVE`, `COMPLETED`, `CLOSED`)
  - `updatedAt`: DateTime

- `MatchTeam`:
  - `id`: String (Primary Key)
  - `matchId`: String (Foreign Key -> `Match.id`)
  - `teamId`: String (Foreign Key -> `Team.id`)
  - `slotNumber`: Int? (Lobby Slot 1-25)

### 3.7 Scoring & Results
- `TeamMatchScore`:
  - `id`: String (Primary Key)
  - `matchId`: String (Foreign Key -> `Match.id`)
  - `teamId`: String (Foreign Key -> `Team.id`)
  - `placement`: Int (1 to 25)
  - `kills`: Int (Default: 0)
  - `placementPoints`: Float (Computed via scoring rule)
  - `killPoints`: Float (Computed via scoring rule)
  - `bonusPoints`: Float (Default: 0.0)
  - `penaltyPoints`: Float (Default: 0.0)
  - `totalPoints`: Float (Computed sum)
  - `isWwcd`: Boolean (Default: false)
  - `notes`: String?
  - `createdAt`, `updatedAt`

### 3.8 Attendance, Penalties, Disputes, Audits
- `Attendance`:
  - `id`: String (Primary Key)
  - `tournamentId`: String (Foreign Key -> `Tournament.id`)
  - `teamId`: String (Foreign Key -> `Team.id`)
  - `matchId`: String? (Foreign Key -> `Match.id`)
  - `status`: Enum `AttendanceStatus` (`PRESENT`, `ABSENT`, `LATE`, `DISQUALIFIED`, `WITHDRAWN`)
  - `checkedInBy`: String? (Staff name / User ID)
  - `timestamp`: DateTime (Default: now)

- `Penalty`:
  - `id`: String (Primary Key)
  - `tournamentId`: String (Foreign Key -> `Tournament.id`)
  - `teamId`: String (Foreign Key -> `Team.id`)
  - `matchId`: String? (Foreign Key -> `Match.id`)
  - `pointsDeducted`: Float
  - `reason`: String
  - `evidenceUrl`: String?
  - `status`: Enum `PenaltyStatus` (`ACTIVE`, `VOIDED`)
  - `issuedBy`: String
  - `createdAt`, `updatedAt`

- `Dispute`:
  - `id`: String (Primary Key)
  - `tournamentId`: String (Foreign Key -> `Tournament.id`)
  - `teamId`: String (Foreign Key -> `Team.id`)
  - `matchId`: String? (Foreign Key -> `Match.id`)
  - `category`: String (e.g. "Scoring", "Unsportsmanlike", "Hacking/Cheating", "No-show")
  - `description`: String
  - `evidenceUrl`: String?
  - `status`: Enum `DisputeStatus` (`OPEN`, `UNDER_REVIEW`, `ACCEPTED`, `REJECTED`, `RESOLVED`)
  - `resolutionNotes`: String?
  - `resolvedBy`: String?
  - `createdAt`, `updatedAt`

- `AuditLog`:
  - `id`: String (Primary Key)
  - `tournamentId`: String?
  - `userId`: String?
  - `action`: String (e.g. "SCORE_UPDATED", "MATCH_VERIFIED", "PENALTY_ISSUED")
  - `entityType`: String (e.g. "Match", "TeamMatchScore", "Penalty")
  - `entityId`: String
  - `beforeState`: String? (JSON String)
  - `afterState`: String? (JSON String)
  - `reason`: String?
  - `createdAt`: DateTime (Default: now)
