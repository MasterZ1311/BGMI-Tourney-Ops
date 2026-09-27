import { db } from '@/lib/db';
import { TournamentUpdateSchema } from '@/lib/validation/schemas';
import { apiSuccess, apiError, handleRouteError } from '@/lib/services/api-response';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const tournament = await db.tournament.findUnique({
      where: { id: params.id },
      include: {
        settings: true,
        scoringRule: true,
        groups: {
          include: {
            _count: { select: { teams: true, matches: true } },
          },
        },
        _count: {
          select: {
            teams: true,
            matches: true,
            penalties: true,
            disputes: true,
          },
        },
      },
    });

    if (!tournament) {
      return apiError('Tournament not found', { status: 404, code: 'NOT_FOUND', path: `/api/tournaments/${params.id}` });
    }

    return apiSuccess(tournament);
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to fetch tournament', `/api/tournaments/${params.id}`);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validated = TournamentUpdateSchema.parse(body);

    const existing = await db.tournament.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return apiError('Tournament not found', { status: 404, code: 'NOT_FOUND', path: `/api/tournaments/${params.id}` });
    }

    if (existing.isFinalized && validated.status && validated.status !== existing.status) {
      return apiError('Cannot modify status of an officially finalized tournament', {
        status: 409,
        code: 'FINALIZED_LOCKED',
        path: `/api/tournaments/${params.id}`,
      });
    }

    const updated = await db.tournament.update({
      where: { id: params.id },
      data: {
        ...(validated.name !== undefined && { name: validated.name }),
        ...(validated.organizer !== undefined && { organizer: validated.organizer }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.format !== undefined && { format: validated.format }),
        ...(validated.status !== undefined && { status: validated.status }),
        ...(validated.startDate !== undefined && { startDate: new Date(validated.startDate) }),
        ...(validated.endDate !== undefined && { endDate: new Date(validated.endDate) }),
        ...(validated.venue !== undefined && { venue: validated.venue }),
        ...(validated.contactEmail !== undefined && { contactEmail: validated.contactEmail }),
      },
    });

    await db.auditLog.create({
      data: {
        tournamentId: params.id,
        action: 'TOURNAMENT_UPDATED',
        entityType: 'Tournament',
        entityId: params.id,
        beforeState: JSON.stringify({ status: existing.status }),
        afterState: JSON.stringify({ status: updated.status }),
        reason: validated.reason || 'Admin status transition or metadata edit',
      },
    });

    return apiSuccess(updated);
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to update tournament', `/api/tournaments/${params.id}`);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await db.tournament.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return apiError('Tournament not found', { status: 404, code: 'NOT_FOUND', path: `/api/tournaments/${params.id}` });
    }

    await db.tournament.delete({
      where: { id: params.id },
    });

    return apiSuccess({ deleted: true, id: params.id });
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to delete tournament', `/api/tournaments/${params.id}`);
  }
}
