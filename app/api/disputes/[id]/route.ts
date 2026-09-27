import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const existing = await db.dispute.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { message: 'Dispute not found' } },
        { status: 404 }
      );
    }

    const updated = await db.dispute.update({
      where: { id: params.id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.resolutionNotes !== undefined && { resolutionNotes: body.resolutionNotes }),
        ...(body.resolvedBy !== undefined && { resolvedBy: body.resolvedBy }),
      },
    });

    await db.auditLog.create({
      data: {
        tournamentId: existing.tournamentId,
        action: 'DISPUTE_UPDATED',
        entityType: 'Dispute',
        entityId: existing.id,
        beforeState: JSON.stringify({ status: existing.status }),
        afterState: JSON.stringify({ status: updated.status, notes: updated.resolutionNotes }),
        reason: `Dispute updated to ${updated.status}`,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to update dispute' } },
      { status: 400 }
    );
  }
}
