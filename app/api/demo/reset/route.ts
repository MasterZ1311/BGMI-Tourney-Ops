import { NextResponse } from 'next/server';
import { resetDemoTournament } from '@/lib/seed-service';

export async function POST() {
  try {
    const tournament = await resetDemoTournament();
    return NextResponse.json({
      success: true,
      data: {
        tournamentId: tournament.id,
        name: tournament.name,
        message: 'Demo tournament cleanly reset to initial match-day state.',
      },
    });
  } catch (error: any) {
    console.error('Demo reset error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to reset demo data' } },
      { status: 500 }
    );
  }
}
