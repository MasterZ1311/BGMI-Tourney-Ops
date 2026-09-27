import { db } from '@/lib/db';
import { DisputeUpdateSchema } from '@/lib/validation/schemas';
import { apiSuccess, apiError, handleRouteError } from '@/lib/services/api-response';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const dispute = await db.dispute.findUnique({
      where: { id: params.id },
      include: {
        team: { select: { id: true, name: true, tag: true } },
        match: { select: { id: true, matchNumber: true, title: true } },
      },
    });

    if (!dispute) {
      return apiError('Dispute not found', {
        status: 404,
        code: 'NOT_FOUND',
        path: `/api/disputes/${params.id}`,
      });
    }

    return apiSuccess(dispute);
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to fetch dispute', `/api/disputes/${params.id}`);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validated = DisputeUpdateSchema.parse(body);

    const existing = await db.dispute.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return apiError('Dispute not found', {
        status: 404,
        code: 'NOT_FOUND',
        path: `/api/disputes/${params.id}`,
      });
    }

    const updated = await db.dispute.update({
      where: { id: params.id },
      data: {
        ...(validated.status !== undefined && { status: validated.status }),
        ...(validated.resolutionNotes !== undefined && { resolutionNotes: validated.resolutionNotes }),
        ...(validated.resolvedBy !== undefined && { resolvedBy: validated.resolvedBy }),
      },
      include: {
        team: { select: { id: true, name: true, tag: true } },
      },
    });

    await db.auditLog.create({
      data: {
        tournamentId: existing.tournamentId,
        action: 'DISPUTE_UPDATED',
        entityType: 'Dispute',
        entityId: existing.id,
        beforeState: JSON.stringify({ status: existing.status }),
        afterState: JSON.stringify({ status: updated.status, notes: updated.resolutionNotes }),
        reason: `Dispute status transitioned to ${updated.status}`,
      },
    });

    return apiSuccess(updated);
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to update dispute', `/api/disputes/${params.id}`);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await db.dispute.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return apiError('Dispute not found', {
        status: 404,
        code: 'NOT_FOUND',
        path: `/api/disputes/${params.id}`,
      });
    }

    await db.dispute.delete({
      where: { id: params.id },
    });

    return apiSuccess({ deleted: true, id: params.id });
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to delete dispute', `/api/disputes/${params.id}`);
  }
}
