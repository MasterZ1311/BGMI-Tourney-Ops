import { resetDemoTournament } from '@/lib/seed-service';
import { apiSuccess, handleRouteError } from '@/lib/services/api-response';

export async function POST() {
  try {
    const tournament = await resetDemoTournament();
    return apiSuccess({
      tournamentId: tournament.id,
      name: tournament.name,
      message: 'Demo tournament cleanly reset to initial match-day state.',
    });
  } catch (error: unknown) {
    console.error('Demo reset error:', error);
    return handleRouteError(error, 'Failed to reset demo data', '/api/demo/reset');
  }
}
