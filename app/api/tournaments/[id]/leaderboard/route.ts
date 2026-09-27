import { db } from '@/lib/db';
import { calculateTournamentLeaderboard } from '@/lib/scoring/engine';
import { BGIS_10_POINT_SYSTEM } from '@/lib/scoring/presets';
import { ScoringRuleConfig } from '@/lib/scoring/types';
import { apiSuccess, apiError, handleRouteError } from '@/lib/services/api-response';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('groupId');
    const matchId = searchParams.get('matchId');

    const tournament = await db.tournament.findUnique({
      where: { id: params.id },
      include: { scoringRule: true },
    });

    if (!tournament) {
      return apiError('Tournament not found', {
        status: 404,
        code: 'NOT_FOUND',
        path: `/api/tournaments/${params.id}/leaderboard`,
      });
    }

    // Resolve scoring rule
    let ruleConfig: ScoringRuleConfig = BGIS_10_POINT_SYSTEM;
    if (tournament.scoringRule) {
      try {
        ruleConfig = {
          name: tournament.scoringRule.name,
          placementPoints: typeof tournament.scoringRule.placementPoints === 'string'
            ? JSON.parse(tournament.scoringRule.placementPoints)
            : tournament.scoringRule.placementPoints,
          killPointsPerElim: tournament.scoringRule.killPointsPerElim,
          wwcdBonus: tournament.scoringRule.wwcdBonus,
          tieBreakers: typeof tournament.scoringRule.tieBreakers === 'string'
            ? JSON.parse(tournament.scoringRule.tieBreakers)
            : tournament.scoringRule.tieBreakers,
        };
      } catch (err) {
        console.error('Failed to parse scoring rule JSON, using default BGIS 10', err);
      }
    }

    // Fetch registered squads
    const teams = await db.team.findMany({
      where: {
        tournamentId: params.id,
        ...(groupId ? { groupId } : {}),
      },
      select: { id: true, name: true, tag: true, status: true },
    });

    // Fetch verified/published matches
    const matches = await db.match.findMany({
      where: {
        tournamentId: params.id,
        ...(matchId ? { id: matchId } : {}),
        ...(groupId ? { groupId } : {}),
        resultStatus: { in: ['VERIFIED', 'PUBLISHED'] },
      },
      include: {
        scores: true,
      },
      orderBy: { matchNumber: 'asc' },
    });

    // Map match data for authoritative scoring engine input
    const matchScoresFormatted = matches.map((m) => ({
      matchId: m.id,
      matchNumber: m.matchNumber,
      teamScores: m.scores.map((s) => ({
        teamId: s.teamId,
        placement: s.placement,
        kills: s.kills,
        placementPoints: s.placementPoints,
        killPoints: s.killPoints,
        bonusPoints: s.bonusPoints,
        penaltyPoints: s.penaltyPoints,
        totalPoints: s.totalPoints,
        isWwcd: s.isWwcd,
      })),
    }));

    // Fetch active general penalties
    const penalties = await db.penalty.findMany({
      where: {
        tournamentId: params.id,
        status: 'ACTIVE',
      },
      select: { teamId: true, pointsDeducted: true, status: true },
    });

    // Authoritative delegation: all calculation is executed by pure scoring engine
    const standings = calculateTournamentLeaderboard(
      teams,
      matchScoresFormatted,
      penalties,
      ruleConfig
    );

    return apiSuccess({
      tournamentName: tournament.name,
      totalMatchesCount: matches.length,
      scoringRuleName: ruleConfig.name,
      standings,
    });
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to generate leaderboard', `/api/tournaments/${params.id}/leaderboard`);
  }
}
