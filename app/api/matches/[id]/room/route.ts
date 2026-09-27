import { db } from '@/lib/db';
import { RoomUpdateSchema } from '@/lib/validation/schemas';
import { apiSuccess, apiError, handleRouteError } from '@/lib/services/api-response';
import { canViewerSeeRoomPassword, maskRoomPasswordIfNeeded } from '@/lib/services/auth-helper';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const room = await db.room.findUnique({
      where: { matchId: params.id },
      include: {
        match: {
          select: {
            title: true,
            map: true,
            perspective: true,
            scheduledStartTime: true,
          },
        },
      },
    });

    if (!room) {
      return apiError('Room not found for match', {
        status: 404,
        code: 'NOT_FOUND',
        path: `/api/matches/${params.id}/room`,
      });
    }

    const canSee = canViewerSeeRoomPassword(req);
    const sanitizedRoom = maskRoomPasswordIfNeeded(room, canSee);

    return apiSuccess(sanitizedRoom);
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to fetch room', `/api/matches/${params.id}/room`);
  }
}

async function handleRoomUpdate(
  req: Request,
  params: { id: string }
) {
  const body = await req.json();
  const validated = RoomUpdateSchema.parse(body);

  const room = await db.room.upsert({
    where: { matchId: params.id },
    update: {
      ...(validated.roomId !== undefined && { roomId: validated.roomId }),
      ...(validated.password !== undefined && { password: validated.password }),
      ...(validated.status && { status: validated.status }),
    },
    create: {
      matchId: params.id,
      roomName: `ROOM-${params.id.slice(-4).toUpperCase()}`,
      roomId: validated.roomId,
      password: validated.password,
      status: validated.status || 'READY',
    },
  });

  // If room is set to OPEN or LIVE, sync match status if appropriate
  if (validated.status === 'LIVE') {
    await db.match.update({
      where: { id: params.id },
      data: { status: 'LIVE', actualStartTime: new Date() },
    });
  } else if (validated.status === 'OPEN') {
    await db.match.update({
      where: { id: params.id },
      data: { status: 'OPEN' },
    });
  }

  const match = await db.match.findUnique({
    where: { id: params.id },
    select: { tournamentId: true },
  });

  if (match) {
    await db.auditLog.create({
      data: {
        tournamentId: match.tournamentId,
        action: 'ROOM_UPDATED',
        entityType: 'Room',
        entityId: room.id,
        reason: `Room credentials or status updated to ${room.status}`,
      },
    });
  }

  const canSee = canViewerSeeRoomPassword(req);
  const sanitizedRoom = maskRoomPasswordIfNeeded(room, canSee);

  return apiSuccess(sanitizedRoom);
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    return await handleRoomUpdate(req, params);
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to update room', `/api/matches/${params.id}/room`);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    return await handleRoomUpdate(req, params);
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to update room', `/api/matches/${params.id}/room`);
  }
}
