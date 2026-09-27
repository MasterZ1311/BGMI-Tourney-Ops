import Papa from 'papaparse';
import { CumulativeTeamStanding } from '../scoring/types';

export function exportLeaderboardToCsv(standings: CumulativeTeamStanding[], tournamentName: string): string {
  const data = standings.map((s) => ({
    Rank: s.rank,
    'Team Name': s.teamName,
    Tag: s.teamTag,
    'Matches Played': s.matchesPlayed,
    WWCD: s.wwcdCount,
    'Placement Pts': s.placementPoints,
    'Kill Pts': s.killPoints,
    Bonus: s.bonusPoints,
    Penalties: s.penaltyPoints,
    'Total Points': s.totalPoints,
  }));

  return Papa.unparse(data);
}

export function exportRostersToCsv(
  teams: Array<{
    name: string;
    tag: string;
    captainName?: string | null;
    players: Array<{ name: string; ign: string; characterId: string; role: string; isSubstitute: boolean }>;
  }>
): string {
  const rows: Array<{
    'Team Name': string;
    Tag: string;
    'Captain Name': string;
    'Player Name': string;
    IGN: string;
    'Character ID': string;
    Role: string;
    Type: string;
  }> = [];

  for (const team of teams) {
    for (const player of team.players) {
      rows.push({
        'Team Name': team.name,
        Tag: team.tag,
        'Captain Name': team.captainName || '',
        'Player Name': player.name,
        IGN: player.ign,
        'Character ID': player.characterId,
        Role: player.role,
        Type: player.isSubstitute ? 'Substitute' : 'Starting Lineup',
      });
    }
  }

  return Papa.unparse(rows);
}
