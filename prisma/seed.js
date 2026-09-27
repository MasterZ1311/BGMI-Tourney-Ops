"use strict";

// lib/db.ts
var import_client = require("@prisma/client");
var globalForPrisma = globalThis;
var db = globalForPrisma.prisma ?? new import_client.PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
});
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
async function disconnectDb() {
  await db.$disconnect();
}

// prisma/seed-data.ts
var SEED_GROUPS_DATA = [
  { name: "Group A", teamIndices: [0, 4, 8, 12] },
  // Team SouL, Carnival Gaming, Orangutan, Blind Esports
  { name: "Group B", teamIndices: [1, 5, 9, 13] },
  // GodLike Esports, Revenant Esports, Reckoning Esports, Team 8Bit
  { name: "Group C", teamIndices: [2, 6, 10, 14] },
  // Team XSpark, Entity Gaming, Medal Esports, Hydra Official
  { name: "Group D", teamIndices: [3, 7, 11, 15] }
  // Global Esports, Gods Reign, Gujarat Tigers, Team Forever
];
var SEED_TEAMS_DATA = [
  {
    name: "Team SouL",
    tag: "SOUL",
    captainName: "Manya",
    captainPhone: "+91 98765 01001",
    captainEmail: "manya@teamsoul.gg",
    players: [
      { name: "Mohammad Raja", ign: "Manya", characterId: "5129481928", role: "IGL", isSubstitute: false },
      { name: "Nakul Sharma", ign: "Nakul", characterId: "5192837461", role: "ASSAULTER", isSubstitute: false },
      { name: "Khush Singh", ign: "Joker", characterId: "5182736450", role: "SUPPORT", isSubstitute: false },
      { name: "Manpreet Singh", ign: "Rony", characterId: "5173645281", role: "ASSAULTER", isSubstitute: false },
      { name: "Naman Mathur", ign: "Mortal", characterId: "5102938475", role: "CAPTAIN", isSubstitute: true }
    ]
  },
  {
    name: "GodLike Esports",
    tag: "GODL",
    captainName: "Jonathan",
    captainPhone: "+91 98765 01002",
    captainEmail: "jonathan@godlike.in",
    players: [
      { name: "Jonathan Amaral", ign: "JONATHAN", characterId: "5112233445", role: "ASSAULTER", isSubstitute: false },
      { name: "Suraj Nityanand", ign: "Neyoo", characterId: "5122334455", role: "SUPPORT", isSubstitute: false },
      { name: "Abhishek Choudhary", ign: "ZGOD", characterId: "5133445566", role: "SUPPORT", isSubstitute: false },
      { name: "Simarpreet Singh", ign: "Punkk", characterId: "5144556677", role: "IGL", isSubstitute: false },
      { name: "Chetan Chandgude", ign: "Kronten", characterId: "5155667788", role: "CAPTAIN", isSubstitute: true }
    ]
  },
  {
    name: "Team XSpark",
    tag: "TX",
    captainName: "Shadow",
    captainPhone: "+91 98765 01003",
    captainEmail: "shadow@teamxspark.esports",
    players: [
      { name: "Tushar Choudhary", ign: "SHADOW", characterId: "5211223344", role: "IGL", isSubstitute: false },
      { name: "Harsh Paudwal", ign: "Spraygod", characterId: "5222334455", role: "ASSAULTER", isSubstitute: false },
      { name: "Sarangajyoti Deka", ign: "Sarang", characterId: "5233445566", role: "ASSAULTER", isSubstitute: false },
      { name: "Kylash", ign: "NinjaJod", characterId: "5244556677", role: "SNIPER", isSubstitute: false },
      { name: "Tanmay Singh", ign: "ScoutOP", characterId: "5255667788", role: "CAPTAIN", isSubstitute: true }
    ]
  },
  {
    name: "Global Esports",
    tag: "GE",
    captainName: "Mavi",
    captainPhone: "+91 98765 01004",
    captainEmail: "mavi@globalesports.com",
    players: [
      { name: "Harmandeep Singh", ign: "Mavi", characterId: "5311223344", role: "IGL", isSubstitute: false },
      { name: "Raghav Kohli", ign: "Ninjaboi", characterId: "5322334455", role: "ASSAULTER", isSubstitute: false },
      { name: "Tanzil", ign: "Beast", characterId: "5333445566", role: "SUPPORT", isSubstitute: false },
      { name: "Slugger", ign: "Arcane", characterId: "5344556677", role: "SNIPER", isSubstitute: false },
      { name: "Mayank Prajapati", ign: "Mayank", characterId: "5355667788", role: "SUPPORT", isSubstitute: true }
    ]
  },
  {
    name: "Carnival Gaming",
    tag: "CG",
    captainName: "Omega",
    captainPhone: "+91 98765 01005",
    captainEmail: "omega@carnivalgaming.gg",
    players: [
      { name: "Sahil Jakhar", ign: "Omega", characterId: "5411223344", role: "IGL", isSubstitute: false },
      { name: "Akshat Goel", ign: "Akshat", characterId: "5422334455", role: "ASSAULTER", isSubstitute: false },
      { name: "Naman Sandhu", ign: "Hector", characterId: "5433445566", role: "SUPPORT", isSubstitute: false },
      { name: "Shubham Chawla", ign: "NinjaBoi", characterId: "5444556677", role: "SNIPER", isSubstitute: false },
      { name: "Govind Roy", ign: "Govind", characterId: "5455667788", role: "ASSAULTER", isSubstitute: true }
    ]
  },
  {
    name: "Revenant Esports",
    tag: "RNT",
    captainName: "Sensei",
    captainPhone: "+91 98765 01006",
    captainEmail: "sensei@revenantesports.com",
    players: [
      { name: "Deepak Negi", ign: "Sensei", characterId: "5511223344", role: "IGL", isSubstitute: false },
      { name: "Fierce", ign: "Fierce", characterId: "5522334455", role: "ASSAULTER", isSubstitute: false },
      { name: "AquaNox", ign: "AquaNox", characterId: "5533445566", role: "ASSAULTER", isSubstitute: false },
      { name: "Apollo", ign: "Apollo", characterId: "5544556677", role: "SUPPORT", isSubstitute: false },
      { name: "Ritesh Varma", ign: "Ritz", characterId: "5555667788", role: "SNIPER", isSubstitute: true }
    ]
  },
  {
    name: "Entity Gaming",
    tag: "ENT",
    captainName: "Saumraj",
    captainPhone: "+91 98765 01007",
    captainEmail: "saumraj@entitygaming.in",
    players: [
      { name: "Saumya Raj", ign: "Saumraj", characterId: "5611223344", role: "IGL", isSubstitute: false },
      { name: "Troghn", ign: "Troghn", characterId: "5622334455", role: "ASSAULTER", isSubstitute: false },
      { name: "GamlaBoi", ign: "GamlaBoi", characterId: "5633445566", role: "SUPPORT", isSubstitute: false },
      { name: "Pukar", ign: "Pukar", characterId: "5644556677", role: "SNIPER", isSubstitute: false },
      { name: "Aman Jain", ign: "Aman", characterId: "5655667788", role: "SUPPORT", isSubstitute: true }
    ]
  },
  {
    name: "Gods Reign",
    tag: "GR",
    captainName: "Robin",
    captainPhone: "+91 98765 01008",
    captainEmail: "robin@godsreign.gg",
    players: [
      { name: "Robin Singh", ign: "Robin", characterId: "5711223344", role: "IGL", isSubstitute: false },
      { name: "Simp", ign: "Simp", characterId: "5722334455", role: "ASSAULTER", isSubstitute: false },
      { name: "Vortex", ign: "Vortex", characterId: "5733445566", role: "SUPPORT", isSubstitute: false },
      { name: "Phantom", ign: "Phantom", characterId: "5744556677", role: "SNIPER", isSubstitute: false },
      { name: "Prashant Patel", ign: "Striker", characterId: "5755667788", role: "ASSAULTER", isSubstitute: true }
    ]
  },
  {
    name: "Orangutan",
    tag: "OG",
    captainName: "Ash",
    captainPhone: "+91 98765 01009",
    captainEmail: "ash@orangutan.gg",
    players: [
      { name: "Ashutosh", ign: "Ash", characterId: "5811223344", role: "IGL", isSubstitute: false },
      { name: "Wizz", ign: "WizzGOD", characterId: "5822334455", role: "ASSAULTER", isSubstitute: false },
      { name: "Akki", ign: "Akki", characterId: "5833445566", role: "SUPPORT", isSubstitute: false },
      { name: "Attanki", ign: "Attanki", characterId: "5844556677", role: "ASSAULTER", isSubstitute: false },
      { name: "Faraz Hasan", ign: "Faraz", characterId: "5855667788", role: "SNIPER", isSubstitute: true }
    ]
  },
  {
    name: "Reckoning Esports",
    tag: "REC",
    captainName: "Viper",
    captainPhone: "+91 98765 01010",
    captainEmail: "viper@reckoningesports.com",
    players: [
      { name: "Yash", ign: "Viper", characterId: "5911223344", role: "IGL", isSubstitute: false },
      { name: "Maxy", ign: "Maxy", characterId: "5922334455", role: "ASSAULTER", isSubstitute: false },
      { name: "Hunter", ign: "Hunter", characterId: "5933445566", role: "SUPPORT", isSubstitute: false },
      { name: "Blaze", ign: "Blaze", characterId: "5944556677", role: "SNIPER", isSubstitute: false },
      { name: "Kunal Sharma", ign: "Kunal", characterId: "5955667788", role: "SUPPORT", isSubstitute: true }
    ]
  },
  {
    name: "Medal Esports",
    tag: "MED",
    captainName: "Paradox",
    captainPhone: "+91 98765 01011",
    captainEmail: "paradox@medalesports.gg",
    players: [
      { name: "Ankit", ign: "Paradox", characterId: "6011223344", role: "IGL", isSubstitute: false },
      { name: "Topdawg", ign: "Topdawg", characterId: "6022334455", role: "ASSAULTER", isSubstitute: false },
      { name: "Kyoya", ign: "Kyoya", characterId: "6033445566", role: "SUPPORT", isSubstitute: false },
      { name: "Sayyam", ign: "Sayyam", characterId: "6044556677", role: "SNIPER", isSubstitute: false },
      { name: "Rohan Joshi", ign: "Rohan", characterId: "6055667788", role: "ASSAULTER", isSubstitute: true }
    ]
  },
  {
    name: "Gujarat Tigers",
    tag: "GT",
    captainName: "ClutchGod",
    captainPhone: "+91 98765 01012",
    captainEmail: "clutchgod@gujarattigers.com",
    players: [
      { name: "Vivek Aabhas", ign: "ClutchGod", characterId: "6111223344", role: "IGL", isSubstitute: false },
      { name: "Prince", ign: "Prince", characterId: "6122334455", role: "ASSAULTER", isSubstitute: false },
      { name: "Shadow7", ign: "Shadow7", characterId: "6133445566", role: "SUPPORT", isSubstitute: false },
      { name: "Wicked", ign: "Wicked", characterId: "6144556677", role: "SNIPER", isSubstitute: false },
      { name: "Divyansh Singh", ign: "Divy", characterId: "6155667788", role: "SUPPORT", isSubstitute: true }
    ]
  },
  {
    name: "Blind Esports",
    tag: "BLD",
    captainName: "Spower",
    captainPhone: "+91 98765 01013",
    captainEmail: "spower@blindesports.gg",
    players: [
      { name: "Rudra", ign: "Spower", characterId: "6211223344", role: "ASSAULTER", isSubstitute: false },
      { name: "Skipz", ign: "Skipz", characterId: "6222334455", role: "IGL", isSubstitute: false },
      { name: "Deadly", ign: "Deadly", characterId: "6233445566", role: "SUPPORT", isSubstitute: false },
      { name: "Frost", ign: "Frost", characterId: "6244556677", role: "SNIPER", isSubstitute: false },
      { name: "Nikhil Yadav", ign: "Zero", characterId: "6255667788", role: "ASSAULTER", isSubstitute: true }
    ]
  },
  {
    name: "Team 8Bit",
    tag: "8BIT",
    captainName: "Juicy",
    captainPhone: "+91 98765 01014",
    captainEmail: "juicy@8bitcreatives.in",
    players: [
      { name: "Juicy", ign: "Juicy", characterId: "6311223344", role: "IGL", isSubstitute: false },
      { name: "Mighty", ign: "Mighty", characterId: "6322334455", role: "ASSAULTER", isSubstitute: false },
      { name: "Beast", ign: "Beast8", characterId: "6333445566", role: "SUPPORT", isSubstitute: false },
      { name: "Mac", ign: "Mac", characterId: "6344556677", role: "SNIPER", isSubstitute: false },
      { name: "Animesh Agarwal", ign: "Thug", characterId: "6355667788", role: "CAPTAIN", isSubstitute: true }
    ]
  },
  {
    name: "Hydra Official",
    tag: "HYD",
    captainName: "Dynamo",
    captainPhone: "+91 98765 01015",
    captainEmail: "dynamo@hydraofficial.gg",
    players: [
      { name: "Starboy", ign: "Starboy", characterId: "6422334455", role: "IGL", isSubstitute: false },
      { name: "Dreams", ign: "Dreams", characterId: "6433445566", role: "ASSAULTER", isSubstitute: false },
      { name: "Sparsha", ign: "Sparsha", characterId: "6444556677", role: "SUPPORT", isSubstitute: false },
      { name: "Bhavin Shah", ign: "Alpha", characterId: "6455667788", role: "SNIPER", isSubstitute: false },
      { name: "Aaditya Sawant", ign: "Dynamo", characterId: "6411223344", role: "CAPTAIN", isSubstitute: true }
    ]
  },
  {
    name: "Team Forever",
    tag: "4EVR",
    captainName: "Owais",
    captainPhone: "+91 98765 01016",
    captainEmail: "owais@teamforever.in",
    players: [
      { name: "Mohammed Owais", ign: "Owais", characterId: "6511223344", role: "IGL", isSubstitute: false },
      { name: "Vashu", ign: "Vashu", characterId: "6522334455", role: "ASSAULTER", isSubstitute: false },
      { name: "Kash", ign: "Kash", characterId: "6533445566", role: "SUPPORT", isSubstitute: false },
      { name: "Max", ign: "Max", characterId: "6544556677", role: "SNIPER", isSubstitute: false },
      { name: "Saksham Saini", ign: "Saksham", characterId: "6555667788", role: "ASSAULTER", isSubstitute: true }
    ]
  }
];

// lib/scoring/presets.ts
var BGIS_10_POINT_SYSTEM = {
  name: "Official BGIS 10-Point System",
  placementPoints: {
    1: 10,
    2: 6,
    3: 5,
    4: 4,
    5: 3,
    6: 2,
    7: 1,
    8: 1,
    9: 0,
    10: 0,
    11: 0,
    12: 0,
    13: 0,
    14: 0,
    15: 0,
    16: 0
  },
  killPointsPerElim: 1,
  wwcdBonus: 0,
  tieBreakers: [
    "WWCD",
    "PLACEMENT_POINTS",
    "KILL_POINTS",
    "BEST_MATCH",
    "LAST_MATCH"
  ]
};

// lib/scoring/engine.ts
function calculateSingleTeamScore(arg1, arg2) {
  let input;
  let rule;
  if ("placementPoints" in arg1) {
    rule = arg1;
    input = arg2;
  } else {
    input = arg1;
    rule = arg2;
  }
  if (input.isDisqualified) {
    return {
      teamId: input.teamId,
      placement: input.placement,
      kills: input.kills || 0,
      placementPoints: 0,
      killPoints: 0,
      bonusPoints: 0,
      penaltyPoints: input.penaltyPoints || 0,
      totalPoints: 0,
      isWwcd: false,
      isDisqualified: true,
      notes: input.notes ? `${input.notes} (Disqualified)` : "Disqualified"
    };
  }
  const placementPts = rule.placementPoints[input.placement] ?? 0;
  const killPts = (input.kills || 0) * (rule.killPointsPerElim ?? 1);
  const bonus = (input.bonusPoints || 0) + (input.placement === 1 ? rule.wwcdBonus || 0 : 0);
  const penalty = input.penaltyPoints || 0;
  const rawTotal = placementPts + killPts + bonus - penalty;
  const total = rule.allowNegativeScores ? rawTotal : Math.max(0, rawTotal);
  return {
    teamId: input.teamId,
    placement: input.placement,
    kills: input.kills || 0,
    placementPoints: placementPts,
    killPoints: killPts,
    bonusPoints: bonus,
    penaltyPoints: penalty,
    totalPoints: total,
    isWwcd: input.placement === 1,
    isDisqualified: false,
    notes: input.notes
  };
}

// lib/seed-service.ts
var DEMO_TOURNAMENT_ID = "demo_bgmi_pro_invitational_2026";
async function seedDemoTournament(options) {
  if (options?.forceReset) {
    return resetDemoTournament();
  }
  const existing = await db.tournament.findUnique({
    where: { id: DEMO_TOURNAMENT_ID }
  });
  if (existing) {
    return existing;
  }
  const now = /* @__PURE__ */ new Date();
  const startDate = new Date(now.getTime() - 2 * 60 * 60 * 1e3);
  const endDate = new Date(now.getTime() + 6 * 60 * 60 * 1e3);
  const tournament = await db.tournament.create({
    data: {
      id: DEMO_TOURNAMENT_ID,
      name: "BGMI Pro Invitational 2026",
      organizer: "Krafton Community Esports",
      description: "Official Tier-1 Invitational Battlegrounds Mobile India Championship featuring 16 elite squads.",
      format: "GROUPS_AND_FINALS",
      status: "LIVE",
      startDate,
      endDate,
      venue: "Sathyabama Indoor Arena / Online LAN Hybrid",
      contactEmail: "tournaments@krafton-bgmi.esports",
      settings: {
        create: {
          totalTeamsCap: 16,
          squadSize: 4,
          substitutesCap: 2,
          maxTeamsPerGroup: 16,
          matchDurationMinutes: 30,
          breakDurationMinutes: 15,
          noShowGraceMinutes: 10,
          disputeWindowMinutes: 15,
          allowSubstitutions: true,
          rulesMarkdown: "# Official BGMI Ruleset\n1. No emulators allowed.\n2. In-game names must match roster submission.\n3. Disconnects within 60s warrant lobby remake if <= 2 teams impacted."
        }
      },
      scoringRule: {
        create: {
          name: BGIS_10_POINT_SYSTEM.name,
          placementPoints: JSON.stringify(BGIS_10_POINT_SYSTEM.placementPoints),
          killPointsPerElim: BGIS_10_POINT_SYSTEM.killPointsPerElim,
          wwcdBonus: BGIS_10_POINT_SYSTEM.wwcdBonus,
          tieBreakers: JSON.stringify(BGIS_10_POINT_SYSTEM.tieBreakers)
        }
      }
    }
  });
  const groupRecords = {};
  for (const grp of SEED_GROUPS_DATA) {
    const createdGroup = await db.group.create({
      data: {
        tournamentId: tournament.id,
        name: grp.name,
        isLocked: true
      }
    });
    groupRecords[grp.name] = createdGroup.id;
  }
  const createdTeams = [];
  for (let i = 0; i < SEED_TEAMS_DATA.length; i++) {
    const raw = SEED_TEAMS_DATA[i];
    const assignedGroupDef = SEED_GROUPS_DATA.find((g) => g.teamIndices.includes(i)) || SEED_GROUPS_DATA[0];
    const assignedGroupId = groupRecords[assignedGroupDef.name];
    const team = await db.team.create({
      data: {
        tournamentId: tournament.id,
        groupId: assignedGroupId,
        name: raw.name,
        tag: raw.tag,
        captainName: raw.captainName,
        captainPhone: raw.captainPhone,
        captainEmail: raw.captainEmail,
        verificationStatus: "VERIFIED",
        status: "ACTIVE",
        players: {
          create: raw.players.map((p) => ({
            name: p.name,
            ign: p.ign,
            characterId: p.characterId,
            role: p.role,
            isSubstitute: p.isSubstitute,
            isVerified: true
          }))
        }
      }
    });
    createdTeams.push({ id: team.id, name: team.name, tag: team.tag, groupName: assignedGroupDef.name });
    const attendanceStatus = raw.tag === "REC" ? "LATE" : "PRESENT";
    await db.attendance.create({
      data: {
        tournamentId: tournament.id,
        teamId: team.id,
        status: attendanceStatus,
        checkedInBy: "Chief Marshal"
      }
    });
  }
  const matchConfigs = [
    {
      matchNumber: 1,
      title: "Match #1 - Erangel (Day 1)",
      map: "ERANGEL",
      perspective: "TPP",
      scheduledStartTime: new Date(now.getTime() - 90 * 60 * 1e3),
      actualStartTime: new Date(now.getTime() - 88 * 60 * 1e3),
      actualEndTime: new Date(now.getTime() - 58 * 60 * 1e3),
      status: "VERIFIED",
      resultStatus: "PUBLISHED",
      room: {
        roomName: "BGMI-INV-R01",
        roomId: "8392019",
        password: "bgmi@match1",
        status: "CLOSED"
      }
    },
    {
      matchNumber: 2,
      title: "Match #2 - Miramar (Day 1)",
      map: "MIRAMAR",
      perspective: "TPP",
      scheduledStartTime: new Date(now.getTime() - 45 * 60 * 1e3),
      actualStartTime: new Date(now.getTime() - 43 * 60 * 1e3),
      actualEndTime: new Date(now.getTime() - 15 * 60 * 1e3),
      status: "VERIFIED",
      resultStatus: "PUBLISHED",
      room: {
        roomName: "BGMI-INV-R02",
        roomId: "8392020",
        password: "bgmi@match2",
        status: "CLOSED"
      }
    },
    {
      matchNumber: 3,
      title: "Match #3 - Sanhok (Day 1)",
      map: "SANHOK",
      perspective: "TPP",
      scheduledStartTime: new Date(now.getTime() - 5 * 60 * 1e3),
      actualStartTime: new Date(now.getTime() - 3 * 60 * 1e3),
      actualEndTime: null,
      status: "LIVE",
      resultStatus: "DRAFT",
      room: {
        roomName: "BGMI-INV-R03",
        roomId: "8392021",
        password: "bgmi@match3",
        status: "LIVE"
      }
    },
    {
      matchNumber: 4,
      title: "Match #4 - Vikendi (Day 1 Finals)",
      map: "VIKENDI",
      perspective: "TPP",
      scheduledStartTime: new Date(now.getTime() + 40 * 60 * 1e3),
      actualStartTime: null,
      actualEndTime: null,
      status: "SCHEDULED",
      resultStatus: "DRAFT",
      room: {
        roomName: "BGMI-INV-R04",
        roomId: "8392022",
        password: "bgmi@match4",
        status: "READY"
      }
    },
    {
      matchNumber: 5,
      title: "Match #5 - Erangel (Day 2 Showdown)",
      map: "ERANGEL",
      perspective: "TPP",
      scheduledStartTime: new Date(now.getTime() + 90 * 60 * 1e3),
      actualStartTime: null,
      actualEndTime: null,
      status: "SCHEDULED",
      resultStatus: "DRAFT",
      room: {
        roomName: "BGMI-INV-R05",
        roomId: "8392023",
        password: "bgmi@match5",
        status: "NOT_CREATED"
      }
    },
    {
      matchNumber: 6,
      title: "Match #6 - Miramar (Grand Finale)",
      map: "MIRAMAR",
      perspective: "TPP",
      scheduledStartTime: new Date(now.getTime() + 140 * 60 * 1e3),
      actualStartTime: null,
      actualEndTime: null,
      status: "SCHEDULED",
      resultStatus: "DRAFT",
      room: {
        roomName: "BGMI-INV-R06",
        roomId: "8392024",
        password: "bgmi@match6",
        status: "NOT_CREATED"
      }
    }
  ];
  const createdMatches = [];
  for (const cfg of matchConfigs) {
    const m = await db.match.create({
      data: {
        tournamentId: tournament.id,
        matchNumber: cfg.matchNumber,
        title: cfg.title,
        map: cfg.map,
        perspective: cfg.perspective,
        scheduledStartTime: cfg.scheduledStartTime,
        actualStartTime: cfg.actualStartTime,
        actualEndTime: cfg.actualEndTime,
        status: cfg.status,
        resultStatus: cfg.resultStatus,
        room: {
          create: {
            roomName: cfg.room.roomName,
            roomId: cfg.room.roomId,
            password: cfg.room.password,
            status: cfg.room.status
          }
        }
      }
    });
    createdMatches.push(m);
    for (let slot = 0; slot < createdTeams.length; slot++) {
      await db.matchTeam.create({
        data: {
          matchId: m.id,
          teamId: createdTeams[slot].id,
          slotNumber: slot + 1
        }
      });
    }
  }
  const m1Rankings = [
    { teamIdx: 0, rank: 1, kills: 11 },
    // Team SouL (WWCD)
    { teamIdx: 1, rank: 2, kills: 7 },
    // GodLike Esports
    { teamIdx: 2, rank: 3, kills: 5 },
    // Team XSpark
    { teamIdx: 3, rank: 4, kills: 4 },
    // Global Esports
    { teamIdx: 4, rank: 5, kills: 6 },
    // Carnival Gaming
    { teamIdx: 5, rank: 6, kills: 3 },
    // Revenant Esports
    { teamIdx: 6, rank: 7, kills: 2 },
    // Entity Gaming
    { teamIdx: 7, rank: 8, kills: 3 },
    // Gods Reign
    { teamIdx: 8, rank: 9, kills: 1 },
    // Orangutan
    { teamIdx: 9, rank: 10, kills: 2 },
    // Reckoning Esports
    { teamIdx: 10, rank: 11, kills: 1 },
    // Medal Esports
    { teamIdx: 11, rank: 12, kills: 0 },
    // Gujarat Tigers
    { teamIdx: 12, rank: 13, kills: 1 },
    // Blind Esports
    { teamIdx: 13, rank: 14, kills: 0 },
    // Team 8Bit
    { teamIdx: 14, rank: 15, kills: 0 },
    // Hydra Official
    { teamIdx: 15, rank: 16, kills: 0 }
    // Team Forever
  ];
  for (const row of m1Rankings) {
    const team = createdTeams[row.teamIdx];
    const calc = calculateSingleTeamScore(
      { teamId: team.id, placement: row.rank, kills: row.kills },
      BGIS_10_POINT_SYSTEM
    );
    await db.teamMatchScore.create({
      data: {
        matchId: createdMatches[0].id,
        teamId: team.id,
        placement: calc.placement,
        kills: calc.kills,
        placementPoints: calc.placementPoints,
        killPoints: calc.killPoints,
        bonusPoints: calc.bonusPoints,
        penaltyPoints: calc.penaltyPoints,
        totalPoints: calc.totalPoints,
        isWwcd: calc.isWwcd
      }
    });
  }
  const m2Rankings = [
    { teamIdx: 2, rank: 1, kills: 9 },
    // Team XSpark (WWCD)
    { teamIdx: 4, rank: 2, kills: 8 },
    // Carnival Gaming
    { teamIdx: 0, rank: 3, kills: 6 },
    // Team SouL
    { teamIdx: 8, rank: 4, kills: 7 },
    // Orangutan
    { teamIdx: 1, rank: 5, kills: 4 },
    // GodLike Esports
    { teamIdx: 5, rank: 6, kills: 5 },
    // Revenant Esports
    { teamIdx: 9, rank: 7, kills: 3 },
    // Reckoning Esports
    { teamIdx: 7, rank: 8, kills: 2 },
    // Gods Reign
    { teamIdx: 3, rank: 9, kills: 2 },
    // Global Esports
    { teamIdx: 6, rank: 10, kills: 1 },
    // Entity Gaming
    { teamIdx: 11, rank: 11, kills: 2 },
    // Gujarat Tigers
    { teamIdx: 10, rank: 12, kills: 0 },
    // Medal Esports
    { teamIdx: 13, rank: 13, kills: 1 },
    // Team 8Bit
    { teamIdx: 12, rank: 14, kills: 0 },
    // Blind Esports
    { teamIdx: 14, rank: 15, kills: 0 },
    // Hydra Official
    { teamIdx: 15, rank: 16, kills: 0 }
    // Team Forever
  ];
  for (const row of m2Rankings) {
    const team = createdTeams[row.teamIdx];
    const calc = calculateSingleTeamScore(
      { teamId: team.id, placement: row.rank, kills: row.kills },
      BGIS_10_POINT_SYSTEM
    );
    await db.teamMatchScore.create({
      data: {
        matchId: createdMatches[1].id,
        teamId: team.id,
        placement: calc.placement,
        kills: calc.kills,
        placementPoints: calc.placementPoints,
        killPoints: calc.killPoints,
        bonusPoints: calc.bonusPoints,
        penaltyPoints: calc.penaltyPoints,
        totalPoints: calc.totalPoints,
        isWwcd: calc.isWwcd
      }
    });
  }
  await db.penalty.create({
    data: {
      tournamentId: tournament.id,
      teamId: createdTeams[9].id,
      // Reckoning Esports
      pointsDeducted: 2,
      reason: "Late arrival to lobby check-in (Rule 4.2)",
      status: "ACTIVE",
      issuedBy: "Tournament Admin"
    }
  });
  await db.dispute.create({
    data: {
      tournamentId: tournament.id,
      teamId: createdTeams[1].id,
      // GodLike Esports
      matchId: createdMatches[0].id,
      category: "SCORING",
      description: "Requesting review of elimination credit during final circle flank against Team SouL in Match 1.",
      status: "UNDER_REVIEW",
      resolutionNotes: "Video review in progress by referee team."
    }
  });
  await db.dispute.create({
    data: {
      tournamentId: tournament.id,
      teamId: createdTeams[4].id,
      // Carnival Gaming
      matchId: createdMatches[1].id,
      category: "TECHNICAL",
      description: "Reported micro-stutter on LAN client during Zone 4 rotation.",
      status: "RESOLVED",
      resolutionNotes: "Server logs analyzed: packet flow was optimal (0% loss). Result confirmed.",
      resolvedBy: "Lead Network Marshal"
    }
  });
  await db.auditLog.create({
    data: {
      tournamentId: tournament.id,
      action: "TOURNAMENT_INITIALIZED",
      entityType: "Tournament",
      entityId: tournament.id,
      reason: "Tournament created and seeded with 16 Tier-1 squads across 4 groups."
    }
  });
  await db.auditLog.create({
    data: {
      tournamentId: tournament.id,
      action: "MATCH_RESULT_VERIFIED",
      entityType: "Match",
      entityId: createdMatches[0].id,
      reason: "Match 1 Erangel scores officially audited and published."
    }
  });
  await db.auditLog.create({
    data: {
      tournamentId: tournament.id,
      action: "MATCH_RESULT_VERIFIED",
      entityType: "Match",
      entityId: createdMatches[1].id,
      reason: "Match 2 Miramar scores officially audited and published."
    }
  });
  await db.notification.create({
    data: {
      tournamentId: tournament.id,
      title: "Tournament Live: BGMI Pro Invitational 2026",
      message: "Day 1 is underway! Match 1 and Match 2 results are officially published.",
      type: "SUCCESS",
      isRead: false
    }
  });
  return tournament;
}
async function resetDemoTournament() {
  const existing = await db.tournament.findUnique({
    where: { id: DEMO_TOURNAMENT_ID }
  });
  if (existing) {
    await db.teamMatchScore.deleteMany({ where: { match: { tournamentId: DEMO_TOURNAMENT_ID } } });
    await db.matchTeam.deleteMany({ where: { match: { tournamentId: DEMO_TOURNAMENT_ID } } });
    await db.room.deleteMany({ where: { match: { tournamentId: DEMO_TOURNAMENT_ID } } });
    await db.penalty.deleteMany({ where: { tournamentId: DEMO_TOURNAMENT_ID } });
    await db.dispute.deleteMany({ where: { tournamentId: DEMO_TOURNAMENT_ID } });
    await db.attendance.deleteMany({ where: { tournamentId: DEMO_TOURNAMENT_ID } });
    await db.player.deleteMany({ where: { team: { tournamentId: DEMO_TOURNAMENT_ID } } });
    await db.match.deleteMany({ where: { tournamentId: DEMO_TOURNAMENT_ID } });
    await db.team.deleteMany({ where: { tournamentId: DEMO_TOURNAMENT_ID } });
    await db.group.deleteMany({ where: { tournamentId: DEMO_TOURNAMENT_ID } });
    await db.scoringRule.deleteMany({ where: { tournamentId: DEMO_TOURNAMENT_ID } });
    await db.tournamentSettings.deleteMany({ where: { tournamentId: DEMO_TOURNAMENT_ID } });
    await db.auditLog.deleteMany({ where: { tournamentId: DEMO_TOURNAMENT_ID } });
    await db.notification.deleteMany({ where: { tournamentId: DEMO_TOURNAMENT_ID } });
    await db.tournament.delete({
      where: { id: DEMO_TOURNAMENT_ID }
    });
  }
  return seedDemoTournament();
}

// prisma/seed.ts
async function main() {
  console.log("\u{1F680} Seeding BGMI Pro Invitational 2026 demo tournament...");
  const tournament = await resetDemoTournament();
  console.log(`\u2705 Successfully seeded tournament: "${tournament.name}" (ID: ${tournament.id})`);
}
main().catch((err) => {
  console.error("\u274C Failed to seed database:", err);
  process.exit(1);
}).finally(async () => {
  await disconnectDb();
});
