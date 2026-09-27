# BGMI Tournament Control Center — UI Architecture & Design System

## 1. Design Philosophy
- **Esports Operations First**: High information density, high contrast, clean typography, dark-first palette (`slate-950` / `zinc-900` / `emerald-500` / `amber-500` / `rose-500`).
- **Speed Under Match-Day Pressure**: Single-click actions for attendance, copying room credentials, advancing match states, and keyboard-first tabular score entry.
- **Zero Distraction**: No gratuitous animations, no slow floating glassmorphism, no bloated modals.

## 2. Color System & Semantic Tokens
- **Background Deep**: `#090d16` (slate-950 deep esports navy/black)
- **Card / Surface**: `#111827` (slate-900)
- **Border**: `#1f2937` (slate-800)
- **Primary Accent**: `#10b981` (emerald-500 - for Verified, Active, Winner, Start)
- **Secondary Accent**: `#3b82f6` (blue-500 - for Rooms, Scheduled, Info)
- **Warning / Dispute**: `#f59e0b` (amber-500 - for Late, In-Review, Pending)
- **Danger / Penalty**: `#ef4444` (rose-500 - for Disqualified, Deduction, Error)
- **Muted Text**: `#9ca3af` (gray-400)

## 3. Key Operational Views

### 3.1 Dashboard Command Center
- Instant Status Bar: Live Match ticker, active room credentials, progress bars (Teams verified, matches completed).
- Action Strip: `[Start Match]`, `[Open Room]`, `[Enter Results]`, `[Mark Attendance]`, `[View Leaderboard]`.
- Mini Leaderboard preview & pending dispute alerts.

### 3.2 7-Step Tournament Wizard
- Step 1: Tournament Info
- Step 2: Format & Stages
- Step 3: Team Configuration & Limits
- Step 4: Match & Map Timetable
- Step 5: Scoring Engine Preset Picker
- Step 6: Rulebook & Penalty Policies
- Step 7: Final Audit & Instant Launch

### 3.3 Rapid Score Entry Grid
- Fixed 16-row layout (or 20/25 for custom sizes).
- Rank 1 to 16.
- Team selector dropdown with instant search.
- Tab key jumps between Kills, Bonus, Penalty.
- Live placement points & total point auto-calculation.
- Real-time duplicate rank indicator.

### 3.4 Public Stage / Stream Display Mode (`/display`)
- Optimized for projectors, LED walls, and OBS browser sources.
- Displays Tournament Title, Live Match stats, Top 16 Leaderboard with WWCD badges and total points.
- Automatically excludes private room passwords, admin controls, and audit logs.

## 4. Keyboard Shortcuts
- `/`: Focus global search
- `N`: Quick create (Match / Team / Penalty)
- `M`: Jump to Current Live Match Operations
- `L`: Jump to Official Leaderboard
- `A`: Jump to Attendance Hub
- `S`: Open Score Entry Grid
- `Esc`: Close open modal / drawer
- `?`: Toggle Keyboard Shortcuts Help Sheet
