# BGMI Tournament Control Center — UX Architecture & Design Specification

## 1. UX Principles
- **Tournament Day Pressure**: On match days, admins have under 2 minutes between custom room lobby creation and plane flight. Every click saved prevents delayed broadcasts.
- **Visual Clarity Over Decoration**: High contrast esports design. Statuses are unmistakable:
  - 🟢 Live / Verified / Present
  - 🔵 Scheduled / Ready / Open
  - 🟡 Late / Pending Verification / In Review
  - 🔴 Disqualified / Penalty / Absent
- **Dense Data Presentation**: Admins need to see all 16 teams on one screen without scrolling during score entry.

## 2. Information Architecture
```
Top Header:
  - BGMI TCC Brand
  - Active Tournament Quick-Selector
  - Global Search (Ctrl+/ or /)
  - Quick Action Button (+ New Tournament / Match)
  - Keyboard Shortcuts Dialog Trigger (?)
  - Role Badge (Super Admin) & Demo Controls (Load/Reset Demo)

Contextual Tournament Sub-Nav:
  [Overview] [Teams] [Groups] [Schedule] [Rooms] [Attendance] [Matches] [Scoring] [Leaderboard] [Penalties] [Disputes] [Reports] [Settings]
```

## 3. High-Priority User Journeys

### Journey 1: Pre-Match Lobby Launch
1. Admin clicks **Rooms** or **Matches**.
2. Clicks **[Generate Room ID & Password]** or enters custom room credentials.
3. Clicks **[Copy Credentials]** -> Copies formatted text:
   `BGMI Match #1 | Map: Erangel | Room ID: 1928374 | Password: 991`
4. Clicks **[Mark Live]** when flight starts.

### Journey 2: 60-Second Score Entry
1. Admin clicks **[Enter Results]** from Match Control.
2. 16-row score table opens sorted by rank 1-16.
3. Selects team, types kills, hits `Tab`.
4. Placement points auto-populate based on preset.
5. System flags if any rank is duplicated or missing.
6. Clicks **[Submit for Verification]**.
7. Head Admin clicks **[Verify]** and **[Publish]** -> Leaderboard updates instantly!

### Journey 3: Instant Dispute & Penalty Handling
1. Admin receives protest: "Team B used unauthorized substitute".
2. Admin opens **Disputes**, enters team, evidence, notes.
3. If confirmed, admin clicks **[Issue Penalty]**, selects Team B, enters `-5` points.
4. Leaderboard re-ranks instantly with penalty breakdown clearly visible in the table.

## 4. Mobile & Tablet Responsiveness
- Tablet/Mobile view focuses on the Match Day essentials:
  - Room credentials card with 1-tap copy.
  - Attendance quick-tap present/absent switch.
  - Live Match timer & status toggle.
  - Quick mobile-optimized score entry list.
