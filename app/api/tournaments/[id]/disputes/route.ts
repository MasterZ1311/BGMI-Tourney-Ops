import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DisputeCreateSchema } from '@/lib/validation/schemas';

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

    return NextResponse.json({ success: true, data: disputes });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch disputes' } },
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

    return NextResponse.json({ success: true, data: dispute }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to file dispute' } },
      { status: 400 }
    );
  }
}
