import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { isLocked = true } = body;

    await db.group.updateMany({
      where: { tournamentId: params.id },
      data: { isLocked },
    });

    await db.auditLog.create({
      data: {
        tournamentId: params.id,
        action: isLocked ? 'GROUPS_LOCKED' : 'GROUPS_UNLOCKED',
        entityType: 'Group',
        entityId: params.id,
        reason: isLocked ? 'Admin locked group rosters' : 'Admin unlocked groups for modification',
      },
    });

    return NextResponse.json({ success: true, data: { isLocked } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to update group lock status' } },
      { status: 500 }
    );
  }
}
