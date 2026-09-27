import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const team = await db.team.update({
      where: { id: params.id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.tag && { tag: body.tag.toUpperCase() }),
        ...(body.groupId !== undefined && { groupId: body.groupId }),
        ...(body.verificationStatus && { verificationStatus: body.verificationStatus }),
        ...(body.status && { status: body.status }),
        ...(body.captainName && { captainName: body.captainName }),
        ...(body.captainPhone && { captainPhone: body.captainPhone }),
        ...(body.captainEmail && { captainEmail: body.captainEmail }),
      },
      include: {
        players: true,
      },
    });

    await db.auditLog.create({
      data: {
        tournamentId: team.tournamentId,
        action: 'TEAM_UPDATED',
        entityType: 'Team',
        entityId: team.id,
        afterState: JSON.stringify(body),
        reason: body.reason || 'Admin team modification',
      },
    });

    return NextResponse.json({ success: true, data: team });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to update team' } },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const team = await db.team.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to delete team' } },
      { status: 500 }
    );
  }
}
