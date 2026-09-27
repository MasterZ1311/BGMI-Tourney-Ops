# BGMI Tournament Control Center — Organizer User Guide

## Welcome to BGMI TCC
"Plan. Run. Score. Finalize." — The single dashboard for running professional Battlegrounds Mobile India tournaments with zero spreadsheet headaches.

---

## 1. Quick Start with Demo Tournament
1. Launch the platform at `http://localhost:3000`.
2. Look at the top navigation bar. If no tournament is loaded, click **"Load Demo Tournament"**.
3. The platform will instantly seed the **"BGMI Pro Invitational 2026"** with 32 registered teams, 4 groups, live scheduled matches, verified results, and an active leaderboard.
4. You can explore every screen immediately or click **"Reset Demo Data"** at any time.

---

## 2. End-to-End Tournament Organizer Workflow

### Step 1: Create a Tournament
1. Click **"+ New Tournament"** in the top navigation.
2. Complete the 7-step wizard:
   - Provide name, dates, format, and venue.
   - Configure squad size (4) and substitutes cap (2).
   - Select scoring preset (e.g. Official BGIS 10-Point or BMPS 15-Point).
   - Review and click **"Create Tournament"**.

### Step 2: Register & Verify Teams
1. Navigate to **Teams** in the tournament sub-navigation.
2. Add teams individually or click **"Bulk Import"** to upload a CSV file with team names, tags, and player IGNs + Character IDs.
3. Review roster validity and click **"Verify"** to mark squads eligible.

### Step 3: Organize Groups
1. Go to **Groups**.
2. Click **"Randomize Groups"** to automatically distribute verified teams evenly across Group A, B, C, D using a seeded randomizer.
3. Click **"Lock Groups"** to lock the brackets.

### Step 4: Schedule Matches
1. Go to **Schedule**.
2. Create matches selecting Map (`Erangel`, `Miramar`, `Sanhok`, `Vikendi`), Start Time, and Assigned Group.
3. The system ensures rooms and times do not conflict.

### Step 5: Match Day Operations
1. Go to **Attendance** -> Rapidly mark teams as **Present**, **Late**, or **Absent**.
2. Go to **Rooms** -> Click **"Generate Room"** or enter the in-game Room ID & Password.
3. Click **"Copy Credentials"** to quickly paste to team captains.
4. When teams join lobby, click **"Open Room"** -> When plane takes off, click **"Mark Live"**.
5. When match finishes, click **"End Match"**.

### Step 6: Rapid Score Entry
1. From Match Operations, click **"Enter Results"**.
2. For each rank 1 to 16, select the team and enter their kills.
3. Placement points, kill points, and total score are calculated automatically in real time.
4. Click **"Save Draft"** or **"Submit for Verification"**.
5. As Tournament Admin, review the scores and click **"Verify & Publish"**.
6. The Leaderboard updates immediately!

### Step 7: Penalties & Disputes
1. If a team breaks rules (e.g. late check-in or unauthorized sub), navigate to **Penalties**.
2. Click **"+ Issue Penalty"**, enter points deduction (e.g. `-5`), team, and reason.
3. The penalty is deducted from the cumulative leaderboard and recorded in the audit trail.
4. If a team submits a protest, manage it under **Disputes**.

### Step 8: Public Stage & Stream Overlay
1. Open `/display` in a new window or OBS browser source.
2. It displays a clean, animated, dark esports leaderboard with Chicken Dinner icons and total points. Private room passwords and admin controls are automatically hidden.

### Step 9: Finalize Tournament
1. When all matches are done, navigate to **Settings** -> **"Finalize Tournament"**.
2. The pre-flight checklist verifies:
   - All matches completed.
   - All results verified & published.
   - Zero unresolved disputes.
   - Leaderboard tie-breakers resolved.
3. Click **"Finalize Tournament"** to lock standings and generate the final export.
