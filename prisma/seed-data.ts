export interface SeedPlayer {
  name: string;
  ign: string;
  characterId: string;
  role: 'CAPTAIN' | 'ASSAULTER' | 'SNIPER' | 'SUPPORT' | 'IGL';
  isSubstitute: boolean;
}

export interface SeedTeam {
  name: string;
  tag: string;
  captainName: string;
  captainPhone: string;
  captainEmail: string;
  players: SeedPlayer[];
}

export interface SeedGroupDefinition {
  name: string;
  teamIndices: number[];
}

export const SEED_GROUPS_DATA: SeedGroupDefinition[] = [
  { name: 'Group A', teamIndices: [0, 4, 8, 12] },  // Team SouL, Carnival Gaming, Orangutan, Blind Esports
  { name: 'Group B', teamIndices: [1, 5, 9, 13] },  // GodLike Esports, Revenant Esports, Reckoning Esports, Team 8Bit
  { name: 'Group C', teamIndices: [2, 6, 10, 14] }, // Team XSpark, Entity Gaming, Medal Esports, Hydra Official
  { name: 'Group D', teamIndices: [3, 7, 11, 15] }, // Global Esports, Gods Reign, Gujarat Tigers, Team Forever
];

export const SEED_TEAMS_DATA: SeedTeam[] = [
  {
    name: 'Team SouL',
    tag: 'SOUL',
    captainName: 'Manya',
    captainPhone: '+91 98765 01001',
    captainEmail: 'manya@teamsoul.gg',
    players: [
      { name: 'Mohammad Raja', ign: 'Manya', characterId: '5129481928', role: 'IGL', isSubstitute: false },
      { name: 'Nakul Sharma', ign: 'Nakul', characterId: '5192837461', role: 'ASSAULTER', isSubstitute: false },
      { name: 'Khush Singh', ign: 'Joker', characterId: '5182736450', role: 'SUPPORT', isSubstitute: false },
      { name: 'Manpreet Singh', ign: 'Rony', characterId: '5173645281', role: 'ASSAULTER', isSubstitute: false },
      { name: 'Naman Mathur', ign: 'Mortal', characterId: '5102938475', role: 'CAPTAIN', isSubstitute: true },
    ],
  },
  {
    name: 'GodLike Esports',
    tag: 'GODL',
    captainName: 'Jonathan',
    captainPhone: '+91 98765 01002',
    captainEmail: 'jonathan@godlike.in',
    players: [
      { name: 'Jonathan Amaral', ign: 'JONATHAN', characterId: '5112233445', role: 'ASSAULTER', isSubstitute: false },
      { name: 'Suraj Nityanand', ign: 'Neyoo', characterId: '5122334455', role: 'SUPPORT', isSubstitute: false },
      { name: 'Abhishek Choudhary', ign: 'ZGOD', characterId: '5133445566', role: 'SUPPORT', isSubstitute: false },
      { name: 'Simarpreet Singh', ign: 'Punkk', characterId: '5144556677', role: 'IGL', isSubstitute: false },
      { name: 'Chetan Chandgude', ign: 'Kronten', characterId: '5155667788', role: 'CAPTAIN', isSubstitute: true },
    ],
  },
  {
    name: 'Team XSpark',
    tag: 'TX',
    captainName: 'Shadow',
    captainPhone: '+91 98765 01003',
    captainEmail: 'shadow@teamxspark.esports',
    players: [
      { name: 'Tushar Choudhary', ign: 'SHADOW', characterId: '5211223344', role: 'IGL', isSubstitute: false },
      { name: 'Harsh Paudwal', ign: 'Spraygod', characterId: '5222334455', role: 'ASSAULTER', isSubstitute: false },
      { name: 'Sarangajyoti Deka', ign: 'Sarang', characterId: '5233445566', role: 'ASSAULTER', isSubstitute: false },
      { name: 'Kylash', ign: 'NinjaJod', characterId: '5244556677', role: 'SNIPER', isSubstitute: false },
      { name: 'Tanmay Singh', ign: 'ScoutOP', characterId: '5255667788', role: 'CAPTAIN', isSubstitute: true },
    ],
  },
  {
    name: 'Global Esports',
    tag: 'GE',
    captainName: 'Mavi',
    captainPhone: '+91 98765 01004',
    captainEmail: 'mavi@globalesports.com',
    players: [
      { name: 'Harmandeep Singh', ign: 'Mavi', characterId: '5311223344', role: 'IGL', isSubstitute: false },
      { name: 'Raghav Kohli', ign: 'Ninjaboi', characterId: '5322334455', role: 'ASSAULTER', isSubstitute: false },
      { name: 'Tanzil', ign: 'Beast', characterId: '5333445566', role: 'SUPPORT', isSubstitute: false },
      { name: 'Slugger', ign: 'Arcane', characterId: '5344556677', role: 'SNIPER', isSubstitute: false },
      { name: 'Mayank Prajapati', ign: 'Mayank', characterId: '5355667788', role: 'SUPPORT', isSubstitute: true },
    ],
  },
  {
    name: 'Carnival Gaming',
    tag: 'CG',
    captainName: 'Omega',
    captainPhone: '+91 98765 01005',
    captainEmail: 'omega@carnivalgaming.gg',
    players: [
      { name: 'Sahil Jakhar', ign: 'Omega', characterId: '5411223344', role: 'IGL', isSubstitute: false },
      { name: 'Akshat Goel', ign: 'Akshat', characterId: '5422334455', role: 'ASSAULTER', isSubstitute: false },
      { name: 'Naman Sandhu', ign: 'Hector', characterId: '5433445566', role: 'SUPPORT', isSubstitute: false },
      { name: 'Shubham Chawla', ign: 'NinjaBoi', characterId: '5444556677', role: 'SNIPER', isSubstitute: false },
      { name: 'Govind Roy', ign: 'Govind', characterId: '5455667788', role: 'ASSAULTER', isSubstitute: true },
    ],
  },
  {
    name: 'Revenant Esports',
    tag: 'RNT',
    captainName: 'Sensei',
    captainPhone: '+91 98765 01006',
    captainEmail: 'sensei@revenantesports.com',
    players: [
      { name: 'Deepak Negi', ign: 'Sensei', characterId: '5511223344', role: 'IGL', isSubstitute: false },
      { name: 'Fierce', ign: 'Fierce', characterId: '5522334455', role: 'ASSAULTER', isSubstitute: false },
      { name: 'AquaNox', ign: 'AquaNox', characterId: '5533445566', role: 'ASSAULTER', isSubstitute: false },
      { name: 'Apollo', ign: 'Apollo', characterId: '5544556677', role: 'SUPPORT', isSubstitute: false },
      { name: 'Ritesh Varma', ign: 'Ritz', characterId: '5555667788', role: 'SNIPER', isSubstitute: true },
    ],
  },
  {
    name: 'Entity Gaming',
    tag: 'ENT',
    captainName: 'Saumraj',
    captainPhone: '+91 98765 01007',
    captainEmail: 'saumraj@entitygaming.in',
    players: [
      { name: 'Saumya Raj', ign: 'Saumraj', characterId: '5611223344', role: 'IGL', isSubstitute: false },
      { name: 'Troghn', ign: 'Troghn', characterId: '5622334455', role: 'ASSAULTER', isSubstitute: false },
      { name: 'GamlaBoi', ign: 'GamlaBoi', characterId: '5633445566', role: 'SUPPORT', isSubstitute: false },
      { name: 'Pukar', ign: 'Pukar', characterId: '5644556677', role: 'SNIPER', isSubstitute: false },
      { name: 'Aman Jain', ign: 'Aman', characterId: '5655667788', role: 'SUPPORT', isSubstitute: true },
    ],
  },
  {
    name: 'Gods Reign',
    tag: 'GR',
    captainName: 'Robin',
    captainPhone: '+91 98765 01008',
    captainEmail: 'robin@godsreign.gg',
    players: [
      { name: 'Robin Singh', ign: 'Robin', characterId: '5711223344', role: 'IGL', isSubstitute: false },
      { name: 'Simp', ign: 'Simp', characterId: '5722334455', role: 'ASSAULTER', isSubstitute: false },
      { name: 'Vortex', ign: 'Vortex', characterId: '5733445566', role: 'SUPPORT', isSubstitute: false },
      { name: 'Phantom', ign: 'Phantom', characterId: '5744556677', role: 'SNIPER', isSubstitute: false },
      { name: 'Prashant Patel', ign: 'Striker', characterId: '5755667788', role: 'ASSAULTER', isSubstitute: true },
    ],
  },
  {
    name: 'Orangutan',
    tag: 'OG',
    captainName: 'Ash',
    captainPhone: '+91 98765 01009',
    captainEmail: 'ash@orangutan.gg',
    players: [
      { name: 'Ashutosh', ign: 'Ash', characterId: '5811223344', role: 'IGL', isSubstitute: false },
      { name: 'Wizz', ign: 'WizzGOD', characterId: '5822334455', role: 'ASSAULTER', isSubstitute: false },
      { name: 'Akki', ign: 'Akki', characterId: '5833445566', role: 'SUPPORT', isSubstitute: false },
      { name: 'Attanki', ign: 'Attanki', characterId: '5844556677', role: 'ASSAULTER', isSubstitute: false },
      { name: 'Faraz Hasan', ign: 'Faraz', characterId: '5855667788', role: 'SNIPER', isSubstitute: true },
    ],
  },
  {
    name: 'Reckoning Esports',
    tag: 'REC',
    captainName: 'Viper',
    captainPhone: '+91 98765 01010',
    captainEmail: 'viper@reckoningesports.com',
    players: [
      { name: 'Yash', ign: 'Viper', characterId: '5911223344', role: 'IGL', isSubstitute: false },
      { name: 'Maxy', ign: 'Maxy', characterId: '5922334455', role: 'ASSAULTER', isSubstitute: false },
      { name: 'Hunter', ign: 'Hunter', characterId: '5933445566', role: 'SUPPORT', isSubstitute: false },
      { name: 'Blaze', ign: 'Blaze', characterId: '5944556677', role: 'SNIPER', isSubstitute: false },
      { name: 'Kunal Sharma', ign: 'Kunal', characterId: '5955667788', role: 'SUPPORT', isSubstitute: true },
    ],
  },
  {
    name: 'Medal Esports',
    tag: 'MED',
    captainName: 'Paradox',
    captainPhone: '+91 98765 01011',
    captainEmail: 'paradox@medalesports.gg',
    players: [
      { name: 'Ankit', ign: 'Paradox', characterId: '6011223344', role: 'IGL', isSubstitute: false },
      { name: 'Topdawg', ign: 'Topdawg', characterId: '6022334455', role: 'ASSAULTER', isSubstitute: false },
      { name: 'Kyoya', ign: 'Kyoya', characterId: '6033445566', role: 'SUPPORT', isSubstitute: false },
      { name: 'Sayyam', ign: 'Sayyam', characterId: '6044556677', role: 'SNIPER', isSubstitute: false },
      { name: 'Rohan Joshi', ign: 'Rohan', characterId: '6055667788', role: 'ASSAULTER', isSubstitute: true },
    ],
  },
  {
    name: 'Gujarat Tigers',
    tag: 'GT',
    captainName: 'ClutchGod',
    captainPhone: '+91 98765 01012',
    captainEmail: 'clutchgod@gujarattigers.com',
    players: [
      { name: 'Vivek Aabhas', ign: 'ClutchGod', characterId: '6111223344', role: 'IGL', isSubstitute: false },
      { name: 'Prince', ign: 'Prince', characterId: '6122334455', role: 'ASSAULTER', isSubstitute: false },
      { name: 'Shadow7', ign: 'Shadow7', characterId: '6133445566', role: 'SUPPORT', isSubstitute: false },
      { name: 'Wicked', ign: 'Wicked', characterId: '6144556677', role: 'SNIPER', isSubstitute: false },
      { name: 'Divyansh Singh', ign: 'Divy', characterId: '6155667788', role: 'SUPPORT', isSubstitute: true },
    ],
  },
  {
    name: 'Blind Esports',
    tag: 'BLD',
    captainName: 'Spower',
    captainPhone: '+91 98765 01013',
    captainEmail: 'spower@blindesports.gg',
    players: [
      { name: 'Rudra', ign: 'Spower', characterId: '6211223344', role: 'ASSAULTER', isSubstitute: false },
      { name: 'Skipz', ign: 'Skipz', characterId: '6222334455', role: 'IGL', isSubstitute: false },
      { name: 'Deadly', ign: 'Deadly', characterId: '6233445566', role: 'SUPPORT', isSubstitute: false },
      { name: 'Frost', ign: 'Frost', characterId: '6244556677', role: 'SNIPER', isSubstitute: false },
      { name: 'Nikhil Yadav', ign: 'Zero', characterId: '6255667788', role: 'ASSAULTER', isSubstitute: true },
    ],
  },
  {
    name: 'Team 8Bit',
    tag: '8BIT',
    captainName: 'Juicy',
    captainPhone: '+91 98765 01014',
    captainEmail: 'juicy@8bitcreatives.in',
    players: [
      { name: 'Juicy', ign: 'Juicy', characterId: '6311223344', role: 'IGL', isSubstitute: false },
      { name: 'Mighty', ign: 'Mighty', characterId: '6322334455', role: 'ASSAULTER', isSubstitute: false },
      { name: 'Beast', ign: 'Beast8', characterId: '6333445566', role: 'SUPPORT', isSubstitute: false },
      { name: 'Mac', ign: 'Mac', characterId: '6344556677', role: 'SNIPER', isSubstitute: false },
      { name: 'Animesh Agarwal', ign: 'Thug', characterId: '6355667788', role: 'CAPTAIN', isSubstitute: true },
    ],
  },
  {
    name: 'Hydra Official',
    tag: 'HYD',
    captainName: 'Dynamo',
    captainPhone: '+91 98765 01015',
    captainEmail: 'dynamo@hydraofficial.gg',
    players: [
      { name: 'Starboy', ign: 'Starboy', characterId: '6422334455', role: 'IGL', isSubstitute: false },
      { name: 'Dreams', ign: 'Dreams', characterId: '6433445566', role: 'ASSAULTER', isSubstitute: false },
      { name: 'Sparsha', ign: 'Sparsha', characterId: '6444556677', role: 'SUPPORT', isSubstitute: false },
      { name: 'Bhavin Shah', ign: 'Alpha', characterId: '6455667788', role: 'SNIPER', isSubstitute: false },
      { name: 'Aaditya Sawant', ign: 'Dynamo', characterId: '6411223344', role: 'CAPTAIN', isSubstitute: true },
    ],
  },
  {
    name: 'Team Forever',
    tag: '4EVR',
    captainName: 'Owais',
    captainPhone: '+91 98765 01016',
    captainEmail: 'owais@teamforever.in',
    players: [
      { name: 'Mohammed Owais', ign: 'Owais', characterId: '6511223344', role: 'IGL', isSubstitute: false },
      { name: 'Vashu', ign: 'Vashu', characterId: '6522334455', role: 'ASSAULTER', isSubstitute: false },
      { name: 'Kash', ign: 'Kash', characterId: '6533445566', role: 'SUPPORT', isSubstitute: false },
      { name: 'Max', ign: 'Max', characterId: '6544556677', role: 'SNIPER', isSubstitute: false },
      { name: 'Saksham Saini', ign: 'Saksham', characterId: '6555667788', role: 'ASSAULTER', isSubstitute: true },
    ],
  },
];
