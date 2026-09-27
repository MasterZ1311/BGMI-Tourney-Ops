import { db } from '@/lib/db';
import { GroupCreateSchema } from '@/lib/validation/schemas';
import { apiSuccess, apiError, handleRouteError } from '@/lib/services/api-response';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const groups = await db.group.findMany({
      where: { tournamentId: params.id },
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
      orderBy: { name: 'asc' },
    });

    return apiSuccess(groups);
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to fetch groups', `/api/tournaments/${params.id}/groups`);
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validated = GroupCreateSchema.parse(body);

    const group = await db.group.create({
      data: {
        tournamentId: params.id,
        name: validated.name,
      },
    });

    await db.auditLog.create({
      data: {
        tournamentId: params.id,
        action: 'GROUP_CREATED',
        entityType: 'Group',
        entityId: group.id,
        reason: `Group "${group.name}" created`,
      },
    });

    return apiSuccess(group, { status: 201 });
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to create group', `/api/tournaments/${params.id}/groups`);
  }
}
