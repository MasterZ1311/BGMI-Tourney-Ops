import { db } from '@/lib/db';
import { MatchResultSubmissionSchema } from '@/lib/validation/schemas';
import {
  calculateMatchScores,
  validateMatchScoreInputs,
} from '@/lib/scoring/engine';
import { BGIS_10_POINT_SYSTEM } from '@/lib/scoring/presets';
import { ScoringRuleConfig, RawTeamMatchInput } from '@/lib/scoring/types';
import { apiSuccess, apiError, handleRouteError } from '@/lib/services/api-response';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const match = await db.match.findUnique({
      where: { id: params.id },
      include: {
        scores: {
          include: {
            team: {
              select: { id: true, name: true, tag: true, logoUrl: true },
            },
          },
          orderBy: { placement: 'asc' },
        },
      },
    });

    if (!match) {
      return apiError('Match not found', {
        status: 404,
        code: 'NOT_FOUND',
        path: `/api/matches/${params.id}/results`,
      });
    }

    return apiSuccess({
      matchId: match.id,
      matchNumber: match.matchNumber,
      status: match.status,
      resultStatus: match.resultStatus,
      scores: match.scores,
    });
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to fetch match results', `/api/matches/${params.id}/results`);
  }
}

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
      return apiError('Match not found', {
        status: 404,
        code: 'NOT_FOUND',
        path: `/api/matches/${params.id}/results`,
      });
    }

    // Task 3: Protect published match scores from silent modification (return 409 Conflict if resultStatus === 'PUBLISHED')
    if (match.resultStatus === 'PUBLISHED') {
      if (!validated.adminOverride || !validated.overrideReason) {
        return apiError(
          'Match scores have already been PUBLISHED and locked against direct modification. Administrative override (adminOverride: true, overrideReason: string) required.',
          {
            status: 409,
            code: 'PUBLISHED_LOCKED',
            details: {
              matchId: match.id,
              resultStatus: match.resultStatus,
              requirement: 'Explicit administrative override (adminOverride: true, overrideReason: string) required.',
            },
            path: `/api/matches/${params.id}/results`,
          }
        );
      }
    }

    // Normalize score inputs to match RawTeamMatchInput contract
    const rawScores: RawTeamMatchInput[] = validated.scores.map((s) => ({
      teamId: s.teamId,
      placement: s.placement,
      kills: s.kills,
      bonusPoints: s.bonusPoints,
      penaltyPoints: s.penaltyPoints,
      notes: s.notes ?? undefined,
    }));

    // Input validation (checks for duplicate rank, negative kills, empty team, etc.)
    const validationCheck = validateMatchScoreInputs(rawScores);
    if (!validationCheck.isValid) {
      return apiError(validationCheck.errors[0] || 'Score input validation failed', {
        status: 400,
        code: 'VALIDATION_FAILED',
        details: validationCheck.errors,
        path: `/api/matches/${params.id}/results`,
      });
    }

    // Resolve scoring rule
    let scoringRuleConfig: ScoringRuleConfig = BGIS_10_POINT_SYSTEM;
    if (match.tournament.scoringRule) {
      try {
        scoringRuleConfig = {
          name: match.tournament.scoringRule.name,
          placementPoints: typeof match.tournament.scoringRule.placementPoints === 'string'
            ? JSON.parse(match.tournament.scoringRule.placementPoints)
            : match.tournament.scoringRule.placementPoints,
          killPointsPerElim: match.tournament.scoringRule.killPointsPerElim,
          wwcdBonus: match.tournament.scoringRule.wwcdBonus,
          tieBreakers: typeof match.tournament.scoringRule.tieBreakers === 'string'
            ? JSON.parse(match.tournament.scoringRule.tieBreakers)
            : match.tournament.scoringRule.tieBreakers,
        };
      } catch (err) {
        console.error('Failed to parse scoring rule JSON, using default BGIS 10', err);
      }
    }

    // Calculate official scores via pure scoring engine
    const calculatedScores = calculateMatchScores(rawScores, scoringRuleConfig);

    const isOverride = match.resultStatus === 'PUBLISHED' && validated.adminOverride;

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
          resultStatus: isOverride ? 'PUBLISHED' : validated.resultStatus,
          status: isOverride ? 'PUBLISHED' : 'COMPLETED',
          actualEndTime: new Date(),
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          tournamentId: match.tournamentId,
          action: isOverride ? 'MATCH_SCORES_OVERRIDDEN' : 'MATCH_RESULTS_SAVED',
          entityType: 'Match',
          entityId: params.id,
          reason: isOverride
            ? `Admin published score override: ${validated.overrideReason}`
            : `Results saved with status ${validated.resultStatus} for ${calculatedScores.length} teams.`,
        },
      });
    });

    return apiSuccess({
      matchId: params.id,
      resultStatus: isOverride ? 'PUBLISHED' : validated.resultStatus,
      scores: calculatedScores,
    });
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to submit match results', `/api/matches/${params.id}/results`);
  }
}
