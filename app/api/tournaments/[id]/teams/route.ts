import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { TeamCreateSchema } from '@/lib/validation/schemas';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('groupId');
    const status = searchParams.get('status');

    const teams = await db.team.findMany({
      where: {
        tournamentId: params.id,
        ...(groupId ? { groupId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        players: true,
        group: true,
        attendances: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
        penalties: {
          where: { status: 'ACTIVE' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: teams });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch teams' } },
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
    const validated = TeamCreateSchema.parse(body);

    const team = await db.team.create({
      data: {
        tournamentId: params.id,
        groupId: validated.groupId,
        name: validated.name,
        tag: validated.tag.toUpperCase(),
        logoUrl: validated.logoUrl,
        captainName: validated.captainName,
        captainPhone: validated.captainPhone,
        captainEmail: validated.captainEmail,
        verificationStatus: 'VERIFIED',
        status: 'ACTIVE',
        players: {
          create: validated.players?.map((p) => ({
            name: p.name,
            ign: p.ign,
            characterId: p.characterId,
            role: p.role,
            isSubstitute: p.isSubstitute,
            isVerified: p.isVerified,
          })),
        },
      },
      include: {
        players: true,
      },
    });

    // Default attendance
    await db.attendance.create({
      data: {
        tournamentId: params.id,
        teamId: team.id,
        status: 'ABSENT',
      },
    });

    await db.auditLog.create({
      data: {
        tournamentId: params.id,
        action: 'TEAM_REGISTERED',
        entityType: 'Team',
        entityId: team.id,
        afterState: JSON.stringify({ name: team.name, tag: team.tag }),
        reason: 'Team registered manually',
      },
    });

    return NextResponse.json({ success: true, data: team }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to create team' } },
      { status: 400 }
    );
  }
}
