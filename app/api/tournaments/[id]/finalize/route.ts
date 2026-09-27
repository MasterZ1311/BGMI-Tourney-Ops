import { db } from '@/lib/db';
import { auditTournamentFinalization } from '@/lib/tournament/engine';
import { TournamentFinalizeSchema } from '@/lib/validation/schemas';
import { apiSuccess, apiError, handleRouteError } from '@/lib/services/api-response';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const validated = TournamentFinalizeSchema.parse(body);

    const tournament = await db.tournament.findUnique({
      where: { id: params.id },
      include: {
        matches: true,
        disputes: true,
        teams: true,
      },
    });

    if (!tournament) {
      return apiError('Tournament not found', {
        status: 404,
        code: 'NOT_FOUND',
        path: `/api/tournaments/${params.id}/finalize`,
      });
    }

    if (tournament.isFinalized) {
      return apiError('Tournament is already finalized', {
        status: 409,
        code: 'ALREADY_FINALIZED',
        path: `/api/tournaments/${params.id}/finalize`,
      });
    }

    const totalMatches = tournament.matches.length;
    const completedMatches = tournament.matches.filter(
      (m) => m.status === 'COMPLETED' || m.status === 'VERIFIED' || m.status === 'PUBLISHED'
    ).length;
    const verifiedResults = tournament.matches.filter(
      (m) => m.resultStatus === 'PUBLISHED' || m.resultStatus === 'VERIFIED'
    ).length;
    const openDisputes = tournament.disputes.filter(
      (d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW'
    ).length;
    const activeTeams = tournament.teams.filter((t) => t.status === 'ACTIVE').length;

    const audit = auditTournamentFinalization({
      totalMatches,
      completedMatches,
      verifiedResults,
      openDisputesCount: openDisputes,
      activeTeamsCount: activeTeams,
    });

    if (!audit.canFinalize) {
      return apiError('Cannot finalize tournament. Pre-flight checks failed.', {
        status: 400,
        code: 'PREFLIGHT_FAILED',
        details: audit.checklist,
        path: `/api/tournaments/${params.id}/finalize`,
      });
    }

    const finalized = await db.tournament.update({
      where: { id: params.id },
      data: {
        isFinalized: true,
        finalizedAt: new Date(),
        status: 'COMPLETED',
      },
    });

    await db.auditLog.create({
      data: {
        tournamentId: params.id,
        action: 'TOURNAMENT_FINALIZED',
        entityType: 'Tournament',
        entityId: params.id,
        reason: `Passed pre-flight audit checklist and officially finalized by ${validated.confirmedBy || 'Tournament Admin'}.`,
      },
    });

    return apiSuccess({
      tournament: finalized,
      checklist: audit.checklist,
    });
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to finalize tournament', `/api/tournaments/${params.id}/finalize`);
  }
}
