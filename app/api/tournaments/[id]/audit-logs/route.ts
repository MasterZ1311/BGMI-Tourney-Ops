import { db } from '@/lib/db';
import { apiSuccess, handleRouteError } from '@/lib/services/api-response';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const logs = await db.auditLog.findMany({
      where: { tournamentId: params.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return apiSuccess(logs);
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to fetch audit logs', `/api/tournaments/${params.id}/audit-logs`);
  }
}
