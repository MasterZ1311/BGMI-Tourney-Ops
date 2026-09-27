# BGMI Tournament Control Center — Product Requirements Document (PRD)

## 1. Product Summary
- **Product Name**: BGMI Tournament Control Center (BGMI TCC)
- **Tagline**: Plan. Run. Score. Finalize.
- **Target Audience**: Professional, collegiate, community, and grassroots BGMI esports organizers, tournament directors, head admins, lobby admins, and scorekeepers.
- **Core Value Proposition**: Replaces error-prone spreadsheets and fragmented Discord/WhatsApp communication with a single, high-speed, authoritative operations dashboard designed exclusively for Battle Royale tournament mechanics.

## 2. Personas & Roles
1. **Organizer / Super Admin**: Full control over system, tournament lifecycle, permissions, system settings, demo data reset, and audit logs.
2. **Tournament Admin**: Creates tournaments, manages teams, builds groups, configures scoring rules, validates disputes, issues penalties, verifies scores, and finalizes tournaments.
3. **Match Admin / Room Marshall**: Generates rooms, configures lobby maps and perspectives (TPP/FPP), shares credentials, verifies player attendance, marks match status (Ready, Open, Live, Completed).
4. **Scorekeeper**: Dedicated rapid score entry agent. Enters team rankings and kill counts from end-of-match screens. Can draft and submit scores.
5. **Observer / Read-Only Staff / Stream Crew**: Views schedules, rosters, live standings, and public display overlays without access to room passwords or administrative mutation controls.

## 3. Detailed Functional Modules

### 3.1 Tournament Creation & Configuration Wizard
- Guided 7-step wizard:
  1. *Basic Details*: Tournament Name, Organizer, Description, Start/End Timestamps, Venue/Format (Online/LAN), Contact.
  2. *Format*: Single Stage, Multi-Group Stage, Group Stage + Finals, Qualifiers + Finals, Custom.
  3. *Team Roster Config*: Total teams cap, squad size (default 4), max substitutes (1-3), max teams per lobby (16-25).
  4. *Match Config*: Maps (Erangel, Miramar, Sanhok, Vikendi), default match duration (e.g. 30 mins), break time, interval.
  5. *Scoring Engine Config*: Placement points table preset (Official BGIS 10-pt, BMPS 15-pt, Classic PMCO 20-pt, or Custom), kill points per elimination, WWCD bonus, tie-breaker priority order.
  6. *Rulebook & Policies*: No-show grace period (e.g. 5 mins), substitute rules, disconnect protocol, emulator bans, protest/dispute window (e.g. 15 mins post-match).
  7. *Review & Commit*: Full configuration audit and instant creation.

### 3.2 Team & Roster Management
- Team Registry: Team Name, Tag/Acronym, Logo URL/placeholder, Registration Date, Verification Status (Pending, Verified, Flagged), Status (Active, Disqualified, Withdrawn).
- Roster: Captain designation, starting lineup (4 players), substitutes (up to 2), with:
  - Full Name
  - In-Game Name (IGN)
  - BGMI Character ID (Numeric UID, 8-12 digits)
  - Phone/Email contact
  - Verified roster status
- Roster Actions: Quick add, edit, player substitute swap, roster verification toggle, team disqualification, withdrawal.

### 3.3 Bulk Import & Export
- Import formats: CSV and JSON (with Excel CSV compatibility).
- Intelligent column mapper allowing custom column headers to map to:
  `Team Name`, `Tag`, `Captain IGN`, `P1 IGN`, `P1 ID`, `P2 IGN`, `P2 ID`, `P3 IGN`, `P3 ID`, `P4 IGN`, `P4 ID`, `Sub IGN`, `Sub ID`.
- Real-time pre-validation preview showing valid records, duplicate IGNs/UIDs, and missing mandatory fields before commit.

### 3.4 Attendance & Check-In System
- Real-time tournament-day attendance board.
- Statuses: Present, Absent, Late, Disqualified, Withdrawn.
- One-click toggle per team and bulk "Mark All Verified as Present".
- Filter by Group, Search by Team/IGN.
- Timestamp and staff attribution recorded.

### 3.5 Group & Bracket Management
- Create unlimited groups (Group A, Group B, Group C, etc.).
- Add/remove teams, move teams across groups.
- Deterministic seeded randomizer for fair group balancing.
- Group Lock feature to prevent accidental re-shuffling on match day.

### 3.6 Match Scheduler & Timeline
- Visual timeline of tournament matches.
- Automated schedule generator based on match count, start time, maps, and assigned groups.
- Conflict detection preventing double-booking rooms or scheduling teams in overlapping slots.
- Status tracker: Scheduled -> Ready -> Open -> Live -> Completed -> Verified.

### 3.7 Room Operations Center
- Manages BGMI custom room parameters: Room Name, Room ID, Room Password, Map, Perspective (TPP), Room Status.
- One-click copy for Room ID and Password.
- Strict security: Passwords hidden on public displays and observer screens.

### 3.8 Match Operations & Rapid Score Entry
- Match Control Panel: [Open Room], [Start Match], [Mark Live], [End Match], [Enter Results].
- Rapid Tabular Score Entry:
  - Rows sorted 1 to 16.
  - Team selector dropdown with auto-filtering.
  - Kills input with auto-calculation of Kill Points.
  - Placement Points auto-derived from official configured scoring rules.
  - Bonus and Penalty inputs.
  - Live Total calculation.
  - Validation: Prevents duplicate placements and negative kill counts.

### 3.9 Result Verification & Audit Workflow
- 4-Tier State Machine:
  `DRAFT` (entered by Scorekeeper) ->
  `SUBMITTED` (awaiting admin check) ->
  `VERIFIED` (approved by Tournament Admin) ->
  `PUBLISHED` (official live broadcast).
- Immutable Audit Logs recording score adjustments post-publication.

### 3.10 Leaderboard & Standings Engine
- Real-time derived leaderboard.
- Aggregates:
  - Rank
  - Team Name & Tag
  - Matches Played (MP)
  - Chicken Dinners / Wins (WWCD)
  - Total Placement Points (PP)
  - Total Kill Points (KP)
  - Bonus Points
  - Penalty Deductions
  - Cumulative Total Points
- Multi-tier Tie-Breakers:
  1. Total WWCDs
  2. Total Placement Points
  3. Total Kill Points
  4. Highest single-match total score
  5. Placement in the most recent match

### 3.11 Penalties & Dispute Resolution
- Penalty Tracker: Deductions with reason (Late check-in, Rule violation, Teaming/Cheating, Disconnect abuse), attached proof/notes, and issuing staff member.
- Dispute Desk: Teams can file disputes; admins track lifecycle (`OPEN`, `UNDER_REVIEW`, `ACCEPTED`, `REJECTED`, `RESOLVED`) with resolutions logged.

### 3.12 Reports, Export & Display Overlays
- Export standings, match summaries, and rosters in CSV and printable layouts.
- Dedicated Public Display / Stream Overlay view (`/display`): High-contrast, clean, animated-ready standings view for projectors or broadcast overlays, with all admin controls and room credentials stripped.

### 3.13 Tournament Finalization
- 5-point automated pre-flight audit checklist:
  - All scheduled matches completed.
  - All match results verified and published.
  - All disputes resolved.
  - All penalties processed.
  - Leaderboard tie-breakers resolved.
- Hard lock upon finalization preventing unauthorized mutations.
