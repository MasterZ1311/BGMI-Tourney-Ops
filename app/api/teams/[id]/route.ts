import { db } from '@/lib/db';
import { TeamUpdateSchema } from '@/lib/validation/schemas';
import { apiSuccess, apiError, handleRouteError } from '@/lib/services/api-response';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const team = await db.team.findUnique({
      where: { id: params.id },
      include: {
        players: true,
        group: true,
        attendances: {
          orderBy: { timestamp: 'desc' },
          take: 5,
        },
        penalties: true,
        disputes: true,
      },
    });

    if (!team) {
      return apiError('Team not found', {
        status: 404,
        code: 'NOT_FOUND',
        path: `/api/teams/${params.id}`,
      });
    }

    return apiSuccess(team);
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to fetch team', `/api/teams/${params.id}`);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validated = TeamUpdateSchema.parse(body);

    const existing = await db.team.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return apiError('Team not found', {
        status: 404,
        code: 'NOT_FOUND',
        path: `/api/teams/${params.id}`,
      });
    }

    const team = await db.team.update({
      where: { id: params.id },
      data: {
        ...(validated.name !== undefined && { name: validated.name }),
        ...(validated.tag !== undefined && { tag: validated.tag.toUpperCase() }),
        ...(validated.groupId !== undefined && { groupId: validated.groupId }),
        ...(validated.verificationStatus !== undefined && { verificationStatus: validated.verificationStatus }),
        ...(validated.status !== undefined && { status: validated.status }),
        ...(validated.captainName !== undefined && { captainName: validated.captainName }),
        ...(validated.captainPhone !== undefined && { captainPhone: validated.captainPhone }),
        ...(validated.captainEmail !== undefined && { captainEmail: validated.captainEmail }),
      },
      include: {
        players: true,
      },
    });

    await db.auditLog.create({
      data: {
        tournamentId: team.tournamentId,
        action: 'TEAM_UPDATED',
        entityType: 'Team',
        entityId: team.id,
        afterState: JSON.stringify(validated),
        reason: validated.reason || 'Admin team modification',
      },
    });

    return apiSuccess(team);
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to update team', `/api/teams/${params.id}`);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await db.team.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return apiError('Team not found', {
        status: 404,
        code: 'NOT_FOUND',
        path: `/api/teams/${params.id}`,
      });
    }

    await db.team.delete({
      where: { id: params.id },
    });

    return apiSuccess({ deleted: true, id: params.id });
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to delete team', `/api/teams/${params.id}`);
  }
}
