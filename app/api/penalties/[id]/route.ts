import { db } from '@/lib/db';
import { PenaltyVoidSchema } from '@/lib/validation/schemas';
import { apiSuccess, apiError, handleRouteError } from '@/lib/services/api-response';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const penalty = await db.penalty.findUnique({
      where: { id: params.id },
      include: {
        team: { select: { id: true, name: true, tag: true } },
        match: { select: { id: true, matchNumber: true, title: true } },
      },
    });

    if (!penalty) {
      return apiError('Penalty not found', {
        status: 404,
        code: 'NOT_FOUND',
        path: `/api/penalties/${params.id}`,
      });
    }

    return apiSuccess(penalty);
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to fetch penalty', `/api/penalties/${params.id}`);
  }
}

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
        path: `/api/penalties/${params.id}`,
      });
    }

    const penalty = await db.penalty.update({
      where: { id: params.id },
      data: {
        status: validated.status || 'VOIDED',
      },
      include: { team: true },
    });

    await db.auditLog.create({
      data: {
        tournamentId: penalty.tournamentId,
        action: penalty.status === 'VOIDED' ? 'PENALTY_VOIDED' : 'PENALTY_UPDATED',
        entityType: 'Penalty',
        entityId: penalty.id,
        reason: validated.reason || `Penalty of ${penalty.pointsDeducted} pts set to ${penalty.status} by Admin.`,
      },
    });

    return apiSuccess(penalty);
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to update penalty', `/api/penalties/${params.id}`);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await db.penalty.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return apiError('Penalty not found', {
        status: 404,
        code: 'NOT_FOUND',
        path: `/api/penalties/${params.id}`,
      });
    }

    await db.penalty.delete({
      where: { id: params.id },
    });

    return apiSuccess({ deleted: true, id: params.id });
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to delete penalty', `/api/penalties/${params.id}`);
  }
}
