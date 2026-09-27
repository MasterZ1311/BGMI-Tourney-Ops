import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AttendanceMarkSchema } from '@/lib/validation/schemas';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const teams = await db.team.findMany({
      where: { tournamentId: params.id },
      include: {
        attendances: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
        group: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });

    const attendanceRecords = teams.map((team) => ({
      teamId: team.id,
      teamName: team.name,
      teamTag: team.tag,
      group: team.group?.name || 'Unassigned',
      status: team.attendances[0]?.status || 'ABSENT',
      checkedInBy: team.attendances[0]?.checkedInBy || null,
      timestamp: team.attendances[0]?.timestamp || null,
    }));

    const summary = {
      total: teams.length,
      present: attendanceRecords.filter((r) => r.status === 'PRESENT').length,
      late: attendanceRecords.filter((r) => r.status === 'LATE').length,
      absent: attendanceRecords.filter((r) => r.status === 'ABSENT').length,
      disqualified: attendanceRecords.filter((r) => r.status === 'DISQUALIFIED').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        records: attendanceRecords,
        summary,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch attendance' } },
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

    // Check if bulk "Mark All Present" action is requested
    if (body.bulkMarkAllPresent) {
      const teams = await db.team.findMany({
        where: { tournamentId: params.id, status: 'ACTIVE' },
      });

      for (const team of teams) {
        await db.attendance.create({
          data: {
            tournamentId: params.id,
            teamId: team.id,
            status: 'PRESENT',
            checkedInBy: body.checkedInBy || 'Tournament Admin',
          },
        });
      }

      await db.auditLog.create({
        data: {
          tournamentId: params.id,
          action: 'ATTENDANCE_BULK_MARKED',
          entityType: 'Attendance',
          entityId: params.id,
          reason: `Bulk marked ${teams.length} active teams as PRESENT`,
        },
      });

      return NextResponse.json({ success: true, data: { updatedCount: teams.length } });
    }

    // Single team attendance mark
    const validated = AttendanceMarkSchema.parse(body);

    const record = await db.attendance.create({
      data: {
        tournamentId: params.id,
        teamId: validated.teamId,
        matchId: validated.matchId,
        status: validated.status,
        checkedInBy: validated.checkedInBy || 'Staff',
      },
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to mark attendance' } },
      { status: 400 }
    );
  }
}
