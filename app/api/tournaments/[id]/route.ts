import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const tournament = await db.tournament.findUnique({
      where: { id: params.id },
      include: {
        settings: true,
        scoringRule: true,
        groups: {
          include: {
            _count: { select: { teams: true, matches: true } },
          },
        },
        _count: {
          select: {
            teams: true,
            matches: true,
            penalties: true,
            disputes: true,
          },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: { message: 'Tournament not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: tournament });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch tournament' } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const existing = await db.tournament.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { message: 'Tournament not found' } },
        { status: 404 }
      );
    }

    if (existing.isFinalized && body.status && body.status !== existing.status) {
      return NextResponse.json(
        { success: false, error: { message: 'Cannot modify status of a finalized tournament' } },
        { status: 400 }
      );
    }

    const updated = await db.tournament.update({
      where: { id: params.id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.organizer && { organizer: body.organizer }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.format && { format: body.format }),
        ...(body.status && { status: body.status }),
        ...(body.venue !== undefined && { venue: body.venue }),
        ...(body.contactEmail !== undefined && { contactEmail: body.contactEmail }),
      },
    });

    await db.auditLog.create({
      data: {
        tournamentId: params.id,
        action: 'TOURNAMENT_UPDATED',
        entityType: 'Tournament',
        entityId: params.id,
        beforeState: JSON.stringify({ status: existing.status }),
        afterState: JSON.stringify({ status: updated.status }),
        reason: body.reason || 'Admin status transition or edit',
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to update tournament' } },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db.tournament.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to delete tournament' } },
      { status: 500 }
    );
  }
}
