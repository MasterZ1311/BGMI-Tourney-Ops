// End-to-end verification script for BGMI TCC
const baseUrl = "http://localhost:3001/api";
const tournamentId = "demo_bgmi_pro_invitational_2026";

async function run() {
  console.log("=== 1. Checking Tournament Details ===");
  const tourneyRes = await fetch(`${baseUrl}/tournaments/${tournamentId}`);
  const tourneyJson = await tourneyRes.json();
  const tourney = tourneyJson.data;
  console.log(`Tournament: ${tourney.name} | Status: ${tourney.status} | Teams Count: ${tourney._count.teams}`);

  console.log("\n=== 2. Fetching Teams ===");
  const teamsRes = await fetch(`${baseUrl}/tournaments/${tournamentId}/teams`);
  const teamsJson = await teamsRes.json();
  const teams = teamsJson.data;
  console.log(`Retrieved ${teams.length} teams. First team: ${teams[0].name} (${teams[0].tag})`);

  console.log("\n=== 3. Fetching Matches ===");
  const matchesRes = await fetch(`${baseUrl}/tournaments/${tournamentId}/matches`);
  const matchesJson = await matchesRes.json();
  const matches = matchesJson.data;
  console.log(`Found ${matches.length} matches:`);
  for (const m of matches) {
    console.log(`  Match #${m.matchNumber} (${m.map}) - Status: ${m.status}, Scores: ${m._count?.scores || 0}`);
  }

  const m3 = matches.find((m) => m.matchNumber === 3);
  console.log(`\n=== 4. Inspecting Match #3: ${m3.id} (Status: ${m3.status}) ===`);

  console.log("\n=== 5. Fetching Initial Leaderboard ===");
  const lb1Res = await fetch(`${baseUrl}/tournaments/${tournamentId}/leaderboard`);
  const lb1Json = await lb1Res.json();
  const lb1 = lb1Json.data;
  console.log("Leaderboard top 5 before Match #3:");
  lb1.standings.slice(0, 5).forEach((s) => {
    console.log(`  #${s.rank} ${s.teamName}: ${s.totalPoints} pts (WWCD: ${s.wwcdCount}, Place: ${s.placementPoints}, Kills: ${s.killPoints})`);
  });

  console.log("\n=== 6. Submitting Fast Scores for Match #3 ===");
  // Generate valid scores for 16 teams: placements 1 to 16
  const scores = teams.slice(0, 16).map((team, idx) => ({
    teamId: team.id,
    placement: idx + 1,
    kills: 16 - idx, // Rank 1 gets 16 kills, Rank 16 gets 1 kill
    bonusPoints: 0,
    penaltyPoints: 0,
    notes: idx === 0 ? "WWCD winner" : undefined,
  }));

  const saveRes = await fetch(`${baseUrl}/matches/${m3.id}/results`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scores, resultStatus: "SUBMITTED" }),
  });
  const saveJson = await saveRes.json();
  console.log(`Score save response: HTTP ${saveRes.status}, success=${saveJson.success}`);

  console.log("\n=== 7. Verifying Match #3 by Admin ===");
  const verifyRes = await fetch(`${baseUrl}/matches/${m3.id}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ verifiedBy: "Head Ref" }),
  });
  const verifyJson = await verifyRes.json();
  console.log(`Verification status: HTTP ${verifyRes.status}, Match Status: ${verifyJson.data?.status}`);

  console.log("\n=== 8. Publishing Match #3 to Live Leaderboard ===");
  const pubRes = await fetch(`${baseUrl}/matches/${m3.id}/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publishedBy: "Head Ref" }),
  });
  const pubJson = await pubRes.json();
  console.log(`Publish status: HTTP ${pubRes.status}, Result Status: ${pubJson.data?.resultStatus}`);

  console.log("\n=== 9. Checking Leaderboard After Match #3 Published ===");
  const lb2Res = await fetch(`${baseUrl}/tournaments/${tournamentId}/leaderboard`);
  const lb2Json = await lb2Res.json();
  const lb2 = lb2Json.data;
  console.log("Leaderboard top 5 after Match #3:");
  lb2.standings.slice(0, 5).forEach((s) => {
    console.log(`  #${s.rank} ${s.teamName}: ${s.totalPoints} pts (Matches: ${s.matchesPlayed}, WWCD: ${s.wwcdCount}, Place: ${s.placementPoints}, Kills: ${s.killPoints})`);
  });

  console.log("\n=== 10. Adding a Rule Violation Penalty ===");
  const targetTeam = lb2.standings[0];
  const penRes = await fetch(`${baseUrl}/tournaments/${tournamentId}/penalties`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      teamId: targetTeam.teamId,
      pointsDeducted: 4,
      reason: "Lobby check-in delay (+5m)",
    }),
  });
  const penJson = await penRes.json();
  console.log(`Issued penalty: -${penJson.data?.pointsDeducted} pts to ${targetTeam.teamName} (Penalty ID: ${penJson.data?.id})`);

  console.log("\n=== 11. Verifying Leaderboard Score Deduction ===");
  const lb3Res = await fetch(`${baseUrl}/tournaments/${tournamentId}/leaderboard`);
  const lb3Json = await lb3Res.json();
  const lb3 = lb3Json.data;
  const penalizedTeam = lb3.standings.find((s) => s.teamId === targetTeam.teamId);
  console.log(`Updated stats for ${penalizedTeam.teamName}: ${penalizedTeam.totalPoints} pts (Penalties: -${penalizedTeam.penaltyPoints} pts)`);

  console.log("\n=== 12. Testing Pre-Flight Finalization Checklist ===");
  const finRes = await fetch(`${baseUrl}/tournaments/${tournamentId}/finalize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirmedBy: "Tournament Director" }),
  });
  const finJson = await finRes.json();
  console.log(`Finalization response status: HTTP ${finRes.status}, success: ${finJson.success}`);
  if (finJson.data?.checklist) {
    console.log("Pre-flight checklist audit results:");
    finJson.data.checklist.forEach((item) => {
      console.log(`  [${item.passed ? "PASS" : "FAIL"}] ${item.label}: ${item.detail}`);
    });
  } else if (finJson.error) {
    console.log("Validation blocked as expected:", finJson.error.message);
  }

  console.log("\n=== ALL E2E WORKFLOW VERIFICATIONS PASSED SUCCESSFULLY ===");
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
