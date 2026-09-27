import { seedDemoTournament } from '@/lib/seed-service';
import { apiSuccess, handleRouteError } from '@/lib/services/api-response';

export async function POST() {
  try {
    const tournament = await seedDemoTournament();
    return apiSuccess({
      tournamentId: tournament.id,
      name: tournament.name,
      message: 'Demo tournament seeded successfully with 16 BGMI squads, 4 matches, and live standings.',
    });
  } catch (error: unknown) {
    console.error('Demo seed error:', error);
    return handleRouteError(error, 'Failed to seed demo data', '/api/demo/seed');
  }
}
