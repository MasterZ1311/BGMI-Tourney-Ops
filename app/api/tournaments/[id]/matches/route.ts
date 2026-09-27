import { db } from '@/lib/db';
import { generateMatchSchedule } from '@/lib/tournament/engine';
import { MatchCreateSchema, MatchBatchScheduleSchema } from '@/lib/validation/schemas';
import { apiSuccess, handleRouteError } from '@/lib/services/api-response';
import { canViewerSeeRoomPassword, maskRoomPasswordIfNeeded } from '@/lib/services/auth-helper';

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

    const canSeePasswords = canViewerSeeRoomPassword(req);
    const sanitizedMatches = matches.map((m) => ({
      ...m,
      room: maskRoomPasswordIfNeeded(m.room, canSeePasswords),
    }));

    return apiSuccess(sanitizedMatches);
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to fetch matches', `/api/tournaments/${params.id}/matches`);
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
      const validatedBatch = MatchBatchScheduleSchema.parse(body);
      const {
        matchCount,
        startTime = new Date(),
        matchDurationMinutes,
        breakDurationMinutes,
        maps,
        groupIds,
      } = validatedBatch;

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

      const canSeePasswords = canViewerSeeRoomPassword(req);
      const sanitized = createdMatches.map((m) => ({
        ...m,
        room: maskRoomPasswordIfNeeded(m.room, canSeePasswords),
      }));

      return apiSuccess(sanitized, { status: 201 });
    }

    // Single match creation
    const validated = MatchCreateSchema.parse(body);

    const match = await db.match.create({
      data: {
        tournamentId: params.id,
        groupId: validated.groupId,
        matchNumber: validated.matchNumber || 1,
        title: validated.title || `Match #${validated.matchNumber || 1} - ${validated.map}`,
        map: validated.map,
        perspective: validated.perspective,
        scheduledStartTime: new Date(validated.scheduledStartTime || Date.now()),
        status: 'SCHEDULED',
        resultStatus: 'DRAFT',
        room: {
          create: {
            roomName: validated.roomName || `BGMI-ROOM-${validated.matchNumber || 1}`,
            status: 'NOT_CREATED',
          },
        },
      },
      include: { room: true },
    });

    await db.auditLog.create({
      data: {
        tournamentId: params.id,
        action: 'MATCH_CREATED',
        entityType: 'Match',
        entityId: match.id,
        reason: `Created match #${match.matchNumber} (${match.map})`,
      },
    });

    const canSeePasswords = canViewerSeeRoomPassword(req);
    const sanitizedMatch = {
      ...match,
      room: maskRoomPasswordIfNeeded(match.room, canSeePasswords),
    };

    return apiSuccess(sanitizedMatch, { status: 201 });
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to create match', `/api/tournaments/${params.id}/matches`);
  }
}
