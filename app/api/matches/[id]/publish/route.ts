import { db } from '@/lib/db';
import { MatchPublishSchema } from '@/lib/validation/schemas';
import { apiSuccess, apiError, handleRouteError } from '@/lib/services/api-response';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const validated = MatchPublishSchema.parse(body);

    const match = await db.match.findUnique({
      where: { id: params.id },
      include: { _count: { select: { scores: true } } },
    });

    if (!match) {
      return apiError('Match not found', {
        status: 404,
        code: 'NOT_FOUND',
        path: `/api/matches/${params.id}/publish`,
      });
    }

    if (match._count.scores === 0) {
      return apiError('Cannot publish match with no scores', {
        status: 400,
        code: 'NO_SCORES_RECORDED',
        path: `/api/matches/${params.id}/publish`,
      });
    }

    const updated = await db.match.update({
      where: { id: params.id },
      data: {
        resultStatus: 'PUBLISHED',
        status: 'PUBLISHED',
      },
    });

    await db.auditLog.create({
      data: {
        tournamentId: match.tournamentId,
        action: 'MATCH_PUBLISHED',
        entityType: 'Match',
        entityId: params.id,
        reason: `Results officially published to live standings by ${validated.publishedBy || 'Tournament Admin'}.`,
      },
    });

    return apiSuccess(updated);
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to publish match', `/api/matches/${params.id}/publish`);
  }
}
