import { db } from '@/lib/db';
import { MatchUpdateSchema } from '@/lib/validation/schemas';
import { apiSuccess, apiError, handleRouteError } from '@/lib/services/api-response';
import { canViewerSeeRoomPassword, maskRoomPasswordIfNeeded } from '@/lib/services/auth-helper';

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
      return apiError('Match not found', {
        status: 404,
        code: 'NOT_FOUND',
        path: `/api/matches/${params.id}`,
      });
    }

    const canSeePasswords = canViewerSeeRoomPassword(req);
    const sanitized = {
      ...match,
      room: maskRoomPasswordIfNeeded(match.room, canSeePasswords),
    };

    return apiSuccess(sanitized);
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to fetch match', `/api/matches/${params.id}`);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validated = MatchUpdateSchema.parse(body);

    const existing = await db.match.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return apiError('Match not found', {
        status: 404,
        code: 'NOT_FOUND',
        path: `/api/matches/${params.id}`,
      });
    }

    // Protect published match state from silent alterations
    if (
      existing.resultStatus === 'PUBLISHED' &&
      validated.resultStatus &&
      validated.resultStatus !== 'PUBLISHED'
    ) {
      if (!validated.adminOverride || !validated.overrideReason) {
        return apiError(
          'Match is PUBLISHED and locked. Administrative override (adminOverride: true, overrideReason: string) required to change result state.',
          {
            status: 409,
            code: 'PUBLISHED_LOCKED',
            path: `/api/matches/${params.id}`,
          }
        );
      }
    }

    const dataToUpdate: any = {};
    if (validated.status) {
      dataToUpdate.status = validated.status;
      if (validated.status === 'LIVE' && !existing.actualStartTime) {
        dataToUpdate.actualStartTime = new Date();
      }
      if (validated.status === 'COMPLETED' && !existing.actualEndTime) {
        dataToUpdate.actualEndTime = new Date();
      }
    }
    if (validated.title !== undefined) dataToUpdate.title = validated.title;
    if (validated.map !== undefined) dataToUpdate.map = validated.map;
    if (validated.perspective !== undefined) dataToUpdate.perspective = validated.perspective;
    if (validated.scheduledStartTime !== undefined) {
      dataToUpdate.scheduledStartTime = new Date(validated.scheduledStartTime);
    }
    if (validated.resultStatus !== undefined) dataToUpdate.resultStatus = validated.resultStatus;

    const updated = await db.match.update({
      where: { id: params.id },
      data: dataToUpdate,
      include: { room: true },
    });

    await db.auditLog.create({
      data: {
        tournamentId: existing.tournamentId,
        action: validated.adminOverride ? 'MATCH_STATUS_OVERRIDDEN' : 'MATCH_STATUS_CHANGED',
        entityType: 'Match',
        entityId: existing.id,
        beforeState: JSON.stringify({ status: existing.status, resultStatus: existing.resultStatus }),
        afterState: JSON.stringify({ status: updated.status, resultStatus: updated.resultStatus }),
        reason: validated.overrideReason || validated.reason || `Transitioned match to ${updated.status}`,
      },
    });

    const canSeePasswords = canViewerSeeRoomPassword(req);
    const sanitized = {
      ...updated,
      room: maskRoomPasswordIfNeeded(updated.room, canSeePasswords),
    };

    return apiSuccess(sanitized);
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to update match', `/api/matches/${params.id}`);
  }
}
