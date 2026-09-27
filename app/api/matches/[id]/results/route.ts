import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { MatchResultSubmissionSchema } from '@/lib/validation/schemas';
import {
  calculateMatchScores,
  validateMatchScoreInputs,
} from '@/lib/scoring/engine';
import { BGIS_10_POINT_SYSTEM } from '@/lib/scoring/presets';
import { ScoringRuleConfig } from '@/lib/scoring/types';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validated = MatchResultSubmissionSchema.parse(body);

    const match = await db.match.findUnique({
      where: { id: params.id },
      include: {
        tournament: {
          include: { scoringRule: true },
        },
      },
    });

    if (!match) {
      return NextResponse.json(
        { success: false, error: { message: 'Match not found' } },
        { status: 404 }
      );
    }

    // Input validation (checks for duplicate rank, negative kills, etc.)
    const validationCheck = validateMatchScoreInputs(validated.scores);
    if (!validationCheck.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: validationCheck.errors[0],
            details: validationCheck.errors,
          },
        },
        { status: 400 }
      );
    }

    // Resolve scoring rule
    let scoringRuleConfig: ScoringRuleConfig = BGIS_10_POINT_SYSTEM;
    if (match.tournament.scoringRule) {
      try {
        scoringRuleConfig = {
          name: match.tournament.scoringRule.name,
          placementPoints: JSON.parse(match.tournament.scoringRule.placementPoints),
          killPointsPerElim: match.tournament.scoringRule.killPointsPerElim,
          wwcdBonus: match.tournament.scoringRule.wwcdBonus,
          tieBreakers: JSON.parse(match.tournament.scoringRule.tieBreakers),
        };
      } catch (err) {
        console.error('Failed to parse scoring rule JSON, using default BGIS 10', err);
      }
    }

    // Calculate official scores via pure scoring engine
    const calculatedScores = calculateMatchScores(validated.scores, scoringRuleConfig);

    // Save within a transaction
    await db.$transaction(async (tx) => {
      // Clear previous scores if any
      await tx.teamMatchScore.deleteMany({
        where: { matchId: params.id },
      });

      // Insert new scores
      for (const score of calculatedScores) {
        await tx.teamMatchScore.create({
          data: {
            matchId: params.id,
            teamId: score.teamId,
            placement: score.placement,
            kills: score.kills,
            placementPoints: score.placementPoints,
            killPoints: score.killPoints,
            bonusPoints: score.bonusPoints,
            penaltyPoints: score.penaltyPoints,
            totalPoints: score.totalPoints,
            isWwcd: score.isWwcd,
            notes: score.notes,
          },
        });
      }

      // Update match result status
      await tx.match.update({
        where: { id: params.id },
        data: {
          resultStatus: validated.resultStatus,
          status: 'COMPLETED',
          actualEndTime: new Date(),
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          tournamentId: match.tournamentId,
          action: 'MATCH_RESULTS_SAVED',
          entityType: 'Match',
          entityId: params.id,
          reason: `Results saved with status ${validated.resultStatus} for ${calculatedScores.length} teams.`,
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        matchId: params.id,
        resultStatus: validated.resultStatus,
        scores: calculatedScores,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to submit match results' } },
      { status: 400 }
    );
  }
}
