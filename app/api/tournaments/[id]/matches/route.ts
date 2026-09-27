import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateMatchSchedule } from '@/lib/tournament/engine';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('groupId');
    const status = searchParams.get('status');

    const matches = await db.match.findMany({
      where: {
        tournamentId: params.id,
        ...(groupId ? { groupId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        room: true,
        group: true,
        _count: {
          select: { scores: true },
        },
      },
      orderBy: { matchNumber: 'asc' },
    });

    return NextResponse.json({ success: true, data: matches });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch matches' } },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    // Check if bulk generation is requested
    if (body.generateBatch) {
      const {
        matchCount = 4,
        startTime = new Date(),
        matchDurationMinutes = 30,
        breakDurationMinutes = 15,
        maps = ['ERANGEL', 'MIRAMAR', 'SANHOK', 'VIKENDI'],
        groupIds,
      } = body;

      const slots = generateMatchSchedule({
        tournamentId: params.id,
        matchCount,
        startTime: new Date(startTime),
        matchDurationMinutes,
        breakDurationMinutes,
        maps,
        groupIds,
      });

      const createdMatches = [];
      for (const slot of slots) {
        const match = await db.match.create({
          data: {
            tournamentId: params.id,
            groupId: slot.groupId,
            matchNumber: slot.matchNumber,
            title: slot.title,
            map: slot.map,
            perspective: slot.perspective,
            scheduledStartTime: slot.scheduledStartTime,
            status: 'SCHEDULED',
            resultStatus: 'DRAFT',
            room: {
              create: {
                roomName: `BGMI-ROOM-${String(slot.matchNumber).padStart(2, '0')}`,
                status: 'NOT_CREATED',
              },
            },
          },
          include: { room: true },
        });
        createdMatches.push(match);
      }

      await db.auditLog.create({
        data: {
          tournamentId: params.id,
          action: 'MATCHES_BATCH_GENERATED',
          entityType: 'Match',
          entityId: params.id,
          reason: `Generated ${createdMatches.length} matches sequentially`,
        },
      });

      return NextResponse.json({ success: true, data: createdMatches }, { status: 201 });
    }

    // Single match creation
    const {
      matchNumber,
      title,
      map = 'ERANGEL',
      perspective = 'TPP',
      scheduledStartTime,
      groupId,
      roomName,
    } = body;

    const match = await db.match.create({
      data: {
        tournamentId: params.id,
        groupId,
        matchNumber: matchNumber || 1,
        title: title || `Match #${matchNumber || 1} - ${map}`,
        map,
        perspective,
        scheduledStartTime: new Date(scheduledStartTime || Date.now()),
        status: 'SCHEDULED',
        resultStatus: 'DRAFT',
        room: {
          create: {
            roomName: roomName || `BGMI-ROOM-${matchNumber || 1}`,
            status: 'NOT_CREATED',
          },
        },
      },
      include: { room: true },
    });

    return NextResponse.json({ success: true, data: match }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to create match' } },
      { status: 400 }
    );
  }
}
