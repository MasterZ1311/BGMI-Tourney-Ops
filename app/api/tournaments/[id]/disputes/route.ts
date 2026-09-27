import { db } from '@/lib/db';
import { DisputeCreateSchema } from '@/lib/validation/schemas';
import { apiSuccess, handleRouteError } from '@/lib/services/api-response';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const disputes = await db.dispute.findMany({
      where: { tournamentId: params.id },
      include: {
        team: { select: { id: true, name: true, tag: true } },
        match: { select: { id: true, matchNumber: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return apiSuccess(disputes);
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to fetch disputes', `/api/tournaments/${params.id}/disputes`);
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validated = DisputeCreateSchema.parse(body);

    const dispute = await db.dispute.create({
      data: {
        tournamentId: params.id,
        teamId: validated.teamId,
        matchId: validated.matchId,
        category: validated.category,
        description: validated.description,
        evidenceUrl: validated.evidenceUrl,
        status: 'OPEN',
      },
      include: {
        team: { select: { name: true } },
      },
    });

    await db.auditLog.create({
      data: {
        tournamentId: params.id,
        action: 'DISPUTE_FILED',
        entityType: 'Dispute',
        entityId: dispute.id,
        reason: `Dispute filed by ${dispute.team.name}: ${dispute.description}`,
      },
    });

    return apiSuccess(dispute, { status: 201 });
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to file dispute', `/api/tournaments/${params.id}/disputes`);
  }
}
