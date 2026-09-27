import { NextResponse } from 'next/server';
import { seedDemoTournament } from '@/lib/seed-service';

export async function POST() {
  try {
    const tournament = await seedDemoTournament();
    return NextResponse.json({
      success: true,
      data: {
        tournamentId: tournament.id,
        name: tournament.name,
        message: 'Demo tournament seeded successfully with 16 BGMI squads, 4 matches, and live standings.',
      },
    });
  } catch (error: any) {
    console.error('Demo seed error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to seed demo data' } },
      { status: 500 }
    );
  }
}
