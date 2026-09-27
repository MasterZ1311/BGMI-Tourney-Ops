import { db } from '@/lib/db';
import { GroupUpdateSchema } from '@/lib/validation/schemas';
import { apiSuccess, apiError, handleRouteError } from '@/lib/services/api-response';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const group = await db.group.findUnique({
      where: { id: params.id },
      include: {
        teams: {
          select: {
            id: true,
            name: true,
            tag: true,
            verificationStatus: true,
            status: true,
          },
        },
        _count: {
          select: { teams: true, matches: true },
        },
      },
    });

    if (!group) {
      return apiError('Group not found', {
        status: 404,
        code: 'NOT_FOUND',
        path: `/api/groups/${params.id}`,
      });
    }

    return apiSuccess(group);
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to fetch group', `/api/groups/${params.id}`);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validated = GroupUpdateSchema.parse(body);

    const existing = await db.group.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return apiError('Group not found', {
        status: 404,
        code: 'NOT_FOUND',
        path: `/api/groups/${params.id}`,
      });
    }

    // Execute team assignment / removal if requested
    if (validated.addTeamId) {
      await db.team.update({
        where: { id: validated.addTeamId },
        data: { groupId: params.id },
      });
    }

    if (validated.removeTeamId) {
      await db.team.update({
        where: { id: validated.removeTeamId },
        data: { groupId: null },
      });
    }

    const updated = await db.group.update({
      where: { id: params.id },
      data: {
        ...(validated.name !== undefined && { name: validated.name }),
        ...(validated.isLocked !== undefined && { isLocked: validated.isLocked }),
      },
      include: {
        teams: {
          select: { id: true, name: true, tag: true },
        },
        _count: {
          select: { teams: true, matches: true },
        },
      },
    });

    await db.auditLog.create({
      data: {
        tournamentId: existing.tournamentId,
        action: 'GROUP_UPDATED',
        entityType: 'Group',
        entityId: params.id,
        beforeState: JSON.stringify({ name: existing.name, isLocked: existing.isLocked }),
        afterState: JSON.stringify({ name: updated.name, isLocked: updated.isLocked }),
        reason: 'Group metadata, lock, or squad membership updated',
      },
    });

    return apiSuccess(updated);
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to update group', `/api/groups/${params.id}`);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await db.group.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return apiError('Group not found', {
        status: 404,
        code: 'NOT_FOUND',
        path: `/api/groups/${params.id}`,
      });
    }

    // Unassign teams from group before deletion
    await db.team.updateMany({
      where: { groupId: params.id },
      data: { groupId: null },
    });

    await db.group.delete({
      where: { id: params.id },
    });

    return apiSuccess({ deleted: true, id: params.id });
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to delete group', `/api/groups/${params.id}`);
  }
}
