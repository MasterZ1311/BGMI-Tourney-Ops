import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const match = await db.match.findUnique({
      where: { id: params.id },
      include: { _count: { select: { scores: true } } },
    });

    if (!match) {
      return NextResponse.json(
        { success: false, error: { message: 'Match not found' } },
        { status: 404 }
      );
    }

    if (match._count.scores === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'Cannot verify match with no recorded scores' } },
        { status: 400 }
      );
    }

    const updated = await db.match.update({
      where: { id: params.id },
      data: {
        resultStatus: 'VERIFIED',
        status: 'VERIFIED',
      },
    });

    await db.auditLog.create({
      data: {
        tournamentId: match.tournamentId,
        action: 'MATCH_VERIFIED',
        entityType: 'Match',
        entityId: params.id,
        reason: 'Tournament Admin verified match score integrity.',
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to verify match' } },
      { status: 500 }
    );
  }
}
