import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const groups = await db.group.findMany({
      where: { tournamentId: params.id },
      include: {
        teams: {
          select: {
            id: true,
            name: true,
            tag: true,
            verificationStatus: true,
            status: true,
          },
        },
        _count: {
          select: { teams: true, matches: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: groups });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch groups' } },
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
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: { message: 'Group name is required' } },
        { status: 400 }
      );
    }

    const group = await db.group.create({
      data: {
        tournamentId: params.id,
        name: body.name,
      },
    });

    return NextResponse.json({ success: true, data: group }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to create group' } },
      { status: 400 }
    );
  }
}
