import { db } from '@/lib/db';
import { PenaltyCreateSchema } from '@/lib/validation/schemas';
import { apiSuccess, handleRouteError } from '@/lib/services/api-response';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const penalties = await db.penalty.findMany({
      where: { tournamentId: params.id },
      include: {
        team: { select: { id: true, name: true, tag: true } },
        match: { select: { id: true, matchNumber: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return apiSuccess(penalties);
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to fetch penalties', `/api/tournaments/${params.id}/penalties`);
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validated = PenaltyCreateSchema.parse(body);

    const penalty = await db.penalty.create({
      data: {
        tournamentId: params.id,
        teamId: validated.teamId,
        matchId: validated.matchId,
        pointsDeducted: validated.pointsDeducted,
        reason: validated.reason,
        evidenceUrl: validated.evidenceUrl,
        status: 'ACTIVE',
        issuedBy: 'Tournament Admin',
      },
      include: {
        team: { select: { name: true, tag: true } },
      },
    });

    await db.auditLog.create({
      data: {
        tournamentId: params.id,
        action: 'PENALTY_ISSUED',
        entityType: 'Penalty',
        entityId: penalty.id,
        afterState: JSON.stringify({
          team: penalty.team.name,
          points: penalty.pointsDeducted,
          reason: penalty.reason,
        }),
        reason: `Issued penalty of -${penalty.pointsDeducted} pts to ${penalty.team.name}: ${penalty.reason}`,
      },
    });

    return apiSuccess(penalty, { status: 201 });
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to issue penalty', `/api/tournaments/${params.id}/penalties`);
  }
}
