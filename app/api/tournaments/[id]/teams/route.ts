import { db } from '@/lib/db';
import { TeamCreateSchema } from '@/lib/validation/schemas';
import { apiSuccess, apiError, handleRouteError } from '@/lib/services/api-response';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('groupId');
    const status = searchParams.get('status');

    const teams = await db.team.findMany({
      where: {
        tournamentId: params.id,
        ...(groupId ? { groupId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        players: true,
        group: true,
        attendances: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
        penalties: {
          where: { status: 'ACTIVE' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return apiSuccess(teams);
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to fetch teams', `/api/tournaments/${params.id}/teams`);
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validated = TeamCreateSchema.parse(body);

    // 1. Check duplicate team name in tournament
    const existingTeam = await db.team.findFirst({
      where: {
        tournamentId: params.id,
        name: { equals: validated.name },
      },
    });

    if (existingTeam) {
      return apiError(`A team with name "${validated.name}" is already registered in this tournament.`, {
        status: 409,
        code: 'DUPLICATE_TEAM_NAME',
        path: `/api/tournaments/${params.id}/teams`,
      });
    }

    // 2. Validate roster uniqueness for Character IDs
    if (validated.players && validated.players.length > 0) {
      const inputCharacterIds = validated.players.map((p) => p.characterId);
      const uniqueInputIds = new Set(inputCharacterIds);
      if (uniqueInputIds.size !== inputCharacterIds.length) {
        return apiError('Duplicate player Character ID detected within the submitted roster.', {
          status: 422,
          code: 'DUPLICATE_ROSTER_UID',
          path: `/api/tournaments/${params.id}/teams`,
        });
      }

      // Check existing player UIDs in this tournament across active teams
      const existingPlayersWithSameUid = await db.player.findMany({
        where: {
          characterId: { in: inputCharacterIds },
          team: {
            tournamentId: params.id,
            status: 'ACTIVE',
          },
        },
        include: { team: { select: { name: true, tag: true } } },
      });

      if (existingPlayersWithSameUid.length > 0) {
        const conflict = existingPlayersWithSameUid[0];
        return apiError(
          `Player UID ${conflict.characterId} (${conflict.ign}) is already active on team "${conflict.team.name}".`,
          {
            status: 409,
            code: 'CHARACTER_ID_CONFLICT',
            details: existingPlayersWithSameUid.map((p) => ({
              characterId: p.characterId,
              ign: p.ign,
              existingTeam: p.team.name,
            })),
            path: `/api/tournaments/${params.id}/teams`,
          }
        );
      }
    }

    const team = await db.team.create({
      data: {
        tournamentId: params.id,
        groupId: validated.groupId,
        name: validated.name,
        tag: validated.tag.toUpperCase(),
        logoUrl: validated.logoUrl,
        captainName: validated.captainName,
        captainPhone: validated.captainPhone,
        captainEmail: validated.captainEmail,
        verificationStatus: 'VERIFIED',
        status: 'ACTIVE',
        players: {
          create: validated.players?.map((p) => ({
            name: p.name,
            ign: p.ign,
            characterId: p.characterId,
            role: p.role,
            isSubstitute: p.isSubstitute,
            isVerified: p.isVerified,
          })),
        },
      },
      include: {
        players: true,
      },
    });

    // Default attendance record
    await db.attendance.create({
      data: {
        tournamentId: params.id,
        teamId: team.id,
        status: 'ABSENT',
      },
    });

    await db.auditLog.create({
      data: {
        tournamentId: params.id,
        action: 'TEAM_REGISTERED',
        entityType: 'Team',
        entityId: team.id,
        afterState: JSON.stringify({ name: team.name, tag: team.tag }),
        reason: 'Team registered manually with roster',
      },
    });

    return apiSuccess(team, { status: 201 });
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to create team', `/api/tournaments/${params.id}/teams`);
  }
}
