import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));

    const penalty = await db.penalty.update({
      where: { id: params.id },
      data: { status: 'VOIDED' },
      include: { team: true },
    });

    await db.auditLog.create({
      data: {
        tournamentId: penalty.tournamentId,
        action: 'PENALTY_VOIDED',
        entityType: 'Penalty',
        entityId: penalty.id,
        reason: body.reason || `Penalty of ${penalty.pointsDeducted} pts voided by Admin.`,
      },
    });

    return NextResponse.json({ success: true, data: penalty });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to void penalty' } },
      { status: 500 }
    );
  }
}
