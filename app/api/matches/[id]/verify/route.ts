import { db } from '@/lib/db';
import { MatchVerifySchema } from '@/lib/validation/schemas';
import { apiSuccess, apiError, handleRouteError } from '@/lib/services/api-response';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const validated = MatchVerifySchema.parse(body);

    const match = await db.match.findUnique({
      where: { id: params.id },
      include: { _count: { select: { scores: true } } },
    });

    if (!match) {
      return apiError('Match not found', {
        status: 404,
        code: 'NOT_FOUND',
        path: `/api/matches/${params.id}/verify`,
      });
    }

    if (match._count.scores === 0) {
      return apiError('Cannot verify match with no recorded scores', {
        status: 400,
        code: 'NO_SCORES_RECORDED',
        path: `/api/matches/${params.id}/verify`,
      });
    }

    const updated = await db.match.update({
      where: { id: params.id },
      data: {
        resultStatus: 'VERIFIED',
        status: 'VERIFIED',
      },
    });

    await db.auditLog.create({
      data: {
        tournamentId: match.tournamentId,
        action: 'MATCH_VERIFIED',
        entityType: 'Match',
        entityId: params.id,
        reason: `${validated.verifiedBy || 'Tournament Admin'} verified match score integrity.`,
      },
    });

    return apiSuccess(updated);
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to verify match', `/api/matches/${params.id}/verify`);
  }
}
