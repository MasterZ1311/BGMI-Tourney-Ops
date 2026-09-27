import { db } from '@/lib/db';
import { distributeTeamsToGroups } from '@/lib/tournament/engine';
import { GroupRandomizeSchema } from '@/lib/validation/schemas';
import { apiSuccess, apiError, handleRouteError } from '@/lib/services/api-response';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const validated = GroupRandomizeSchema.parse(body);
    const seed = validated.seed ?? Math.floor(Math.random() * 100000);

    const groups = await db.group.findMany({
      where: { tournamentId: params.id },
      orderBy: { name: 'asc' },
    });

    if (groups.length === 0) {
      return apiError('No groups exist. Create groups before randomizing.', {
        status: 400,
        code: 'NO_GROUPS_EXIST',
        path: `/api/tournaments/${params.id}/groups/randomize`,
      });
    }

    // Check if any group is locked
    const lockedGroups = groups.filter((g) => g.isLocked);
    if (lockedGroups.length > 0) {
      return apiError('Cannot randomize teams while groups are locked. Unlock them first.', {
        status: 409,
        code: 'GROUPS_LOCKED',
        path: `/api/tournaments/${params.id}/groups/randomize`,
      });
    }

    const activeTeams = await db.team.findMany({
      where: {
        tournamentId: params.id,
        status: 'ACTIVE',
      },
      select: { id: true, name: true },
    });

    if (activeTeams.length === 0) {
      return apiError('No active teams found to distribute.', {
        status: 400,
        code: 'NO_ACTIVE_TEAMS',
        path: `/api/tournaments/${params.id}/groups/randomize`,
      });
    }

    const distribution = distributeTeamsToGroups({
      tournamentId: params.id,
      groupCount: groups.length,
      teams: activeTeams,
      seed,
    });

    // Execute batch update in a transaction
    await db.$transaction(async (tx) => {
      for (let gIdx = 0; gIdx < groups.length; gIdx++) {
        const targetGroup = groups[gIdx];
        const assignedTeams = distribution.get(gIdx) || [];

        for (const t of assignedTeams) {
          await tx.team.update({
            where: { id: t.id },
            data: { groupId: targetGroup.id },
          });
        }
      }
    });

    await db.auditLog.create({
      data: {
        tournamentId: params.id,
        action: 'GROUPS_RANDOMIZED',
        entityType: 'Group',
        entityId: params.id,
        reason: `Distributed ${activeTeams.length} teams across ${groups.length} groups with seed ${seed}.`,
      },
    });

    return apiSuccess({
      seed,
      groupCount: groups.length,
      distributedTeams: activeTeams.length,
    });
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to randomize groups', `/api/tournaments/${params.id}/groups/randomize`);
  }
}
