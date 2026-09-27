import { db } from '@/lib/db';
import { PenaltyVoidSchema } from '@/lib/validation/schemas';
import { apiSuccess, apiError, handleRouteError } from '@/lib/services/api-response';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const validated = PenaltyVoidSchema.parse(body);

    const existing = await db.penalty.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return apiError('Penalty not found', {
        status: 404,
        code: 'NOT_FOUND',
        path: `/api/penalties/${params.id}/void`,
      });
    }

    const penalty = await db.penalty.update({
      where: { id: params.id },
      data: { status: 'VOIDED' },
      include: { team: true },
    });

    await db.auditLog.create({
      data: {
        tournamentId: penalty.tournamentId,
        action: 'PENALTY_VOIDED',
        entityType: 'Penalty',
        entityId: penalty.id,
        reason: validated.reason || `Penalty of ${penalty.pointsDeducted} pts voided by Admin.`,
      },
    });

    return apiSuccess(penalty);
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to void penalty', `/api/penalties/${params.id}/void`);
  }
}
