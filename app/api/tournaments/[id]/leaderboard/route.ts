import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateTournamentLeaderboard } from '@/lib/scoring/engine';
import { BGIS_10_POINT_SYSTEM } from '@/lib/scoring/presets';
import { ScoringRuleConfig } from '@/lib/scoring/types';

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
      return NextResponse.json(
        { success: false, error: { message: 'Tournament not found' } },
        { status: 404 }
      );
    }

    // Resolve scoring rule
    let ruleConfig: ScoringRuleConfig = BGIS_10_POINT_SYSTEM;
    if (tournament.scoringRule) {
      try {
        ruleConfig = {
          name: tournament.scoringRule.name,
          placementPoints: JSON.parse(tournament.scoringRule.placementPoints),
          killPointsPerElim: tournament.scoringRule.killPointsPerElim,
          wwcdBonus: tournament.scoringRule.wwcdBonus,
          tieBreakers: JSON.parse(tournament.scoringRule.tieBreakers),
        };
      } catch (err) {
        console.error('Failed to parse scoring rule JSON', err);
      }
    }

    // Fetch teams
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

    // Format matches for scoring engine
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

    // Compute live leaderboard with tie-breakers
    const standings = calculateTournamentLeaderboard(
      teams,
      matchScoresFormatted,
      penalties,
      ruleConfig
    );

    return NextResponse.json({
      success: true,
      data: {
        tournamentName: tournament.name,
        totalMatchesCount: matches.length,
        scoringRuleName: ruleConfig.name,
        standings,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to generate leaderboard' } },
      { status: 500 }
    );
  }
}
