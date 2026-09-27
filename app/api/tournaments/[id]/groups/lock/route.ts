import { db } from '@/lib/db';
import { GroupLockSchema } from '@/lib/validation/schemas';
import { apiSuccess, handleRouteError } from '@/lib/services/api-response';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const validated = GroupLockSchema.parse(body);
    const { isLocked = true } = validated;

    await db.group.updateMany({
      where: { tournamentId: params.id },
      data: { isLocked },
    });

    await db.auditLog.create({
      data: {
        tournamentId: params.id,
        action: isLocked ? 'GROUPS_LOCKED' : 'GROUPS_UNLOCKED',
        entityType: 'Group',
        entityId: params.id,
        reason: isLocked ? 'Admin locked group rosters' : 'Admin unlocked groups for modification',
      },
    });

    return apiSuccess({ isLocked });
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to update group lock status', `/api/tournaments/${params.id}/groups/lock`);
  }
}
