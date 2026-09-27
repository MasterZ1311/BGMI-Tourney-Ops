import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { RoomUpdateSchema } from '@/lib/validation/schemas';

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
      return NextResponse.json(
        { success: false, error: { message: 'Room not found for match' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: room });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch room' } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
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

    return NextResponse.json({ success: true, data: room });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to update room' } },
      { status: 400 }
    );
  }
}
