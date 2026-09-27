import { db } from '@/lib/db';
import { AttendanceMarkSchema, AttendanceBulkMarkSchema } from '@/lib/validation/schemas';
import { apiSuccess, handleRouteError } from '@/lib/services/api-response';

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

    return apiSuccess({
      records: attendanceRecords,
      summary,
    });
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to fetch attendance', `/api/tournaments/${params.id}/attendance`);
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
      const validatedBulk = AttendanceBulkMarkSchema.parse(body);
      const teams = await db.team.findMany({
        where: { tournamentId: params.id, status: 'ACTIVE' },
      });

      for (const team of teams) {
        await db.attendance.create({
          data: {
            tournamentId: params.id,
            teamId: team.id,
            status: 'PRESENT',
            checkedInBy: validatedBulk.checkedInBy || 'Tournament Admin',
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

      return apiSuccess({ updatedCount: teams.length });
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

    await db.auditLog.create({
      data: {
        tournamentId: params.id,
        action: 'ATTENDANCE_MARKED',
        entityType: 'Attendance',
        entityId: record.id,
        reason: `Team ${validated.teamId} marked as ${validated.status}`,
      },
    });

    return apiSuccess(record);
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to mark attendance', `/api/tournaments/${params.id}/attendance`);
  }
}
