import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const match = await db.match.findUnique({
      where: { id: params.id },
      include: {
        room: true,
        group: true,
        scores: {
          include: {
            team: {
              select: { id: true, name: true, tag: true, logoUrl: true },
            },
          },
          orderBy: { placement: 'asc' },
        },
      },
    });

    if (!match) {
      return NextResponse.json(
        { success: false, error: { message: 'Match not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: match });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch match' } },
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

    const existing = await db.match.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { message: 'Match not found' } },
        { status: 404 }
      );
    }

    const dataToUpdate: any = {};
    if (body.status) {
      dataToUpdate.status = body.status;
      if (body.status === 'LIVE' && !existing.actualStartTime) {
        dataToUpdate.actualStartTime = new Date();
      }
      if (body.status === 'COMPLETED' && !existing.actualEndTime) {
        dataToUpdate.actualEndTime = new Date();
      }
    }
    if (body.title) dataToUpdate.title = body.title;
    if (body.map) dataToUpdate.map = body.map;
    if (body.perspective) dataToUpdate.perspective = body.perspective;
    if (body.scheduledStartTime) dataToUpdate.scheduledStartTime = new Date(body.scheduledStartTime);
    if (body.resultStatus) dataToUpdate.resultStatus = body.resultStatus;

    const updated = await db.match.update({
      where: { id: params.id },
      data: dataToUpdate,
      include: { room: true },
    });

    await db.auditLog.create({
      data: {
        tournamentId: existing.tournamentId,
        action: 'MATCH_STATUS_CHANGED',
        entityType: 'Match',
        entityId: existing.id,
        beforeState: JSON.stringify({ status: existing.status }),
        afterState: JSON.stringify({ status: updated.status }),
        reason: body.reason || `Transitioned match to ${updated.status}`,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to update match' } },
      { status: 400 }
    );
  }
}
