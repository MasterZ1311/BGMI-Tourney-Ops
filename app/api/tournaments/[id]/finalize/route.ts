import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auditTournamentFinalization } from '@/lib/tournament/engine';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const tournament = await db.tournament.findUnique({
      where: { id: params.id },
      include: {
        matches: true,
        disputes: true,
        teams: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: { message: 'Tournament not found' } },
        { status: 404 }
      );
    }

    if (tournament.isFinalized) {
      return NextResponse.json(
        { success: false, error: { message: 'Tournament is already finalized' } },
        { status: 400 }
      );
    }

    const totalMatches = tournament.matches.length;
    const completedMatches = tournament.matches.filter(
      (m) => m.status === 'COMPLETED' || m.status === 'VERIFIED' || m.status === 'PUBLISHED'
    ).length;
    const verifiedResults = tournament.matches.filter(
      (m) => m.resultStatus === 'PUBLISHED' || m.resultStatus === 'VERIFIED'
    ).length;
    const openDisputes = tournament.disputes.filter(
      (d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW'
    ).length;
    const activeTeams = tournament.teams.filter((t) => t.status === 'ACTIVE').length;

    const audit = auditTournamentFinalization({
      totalMatches,
      completedMatches,
      verifiedResults,
      openDisputesCount: openDisputes,
      activeTeamsCount: activeTeams,
    });

    if (!audit.canFinalize) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PREFLIGHT_FAILED',
            message: 'Cannot finalize tournament. Pre-flight checks failed.',
            details: audit.checklist,
          },
        },
        { status: 400 }
      );
    }

    const finalized = await db.tournament.update({
      where: { id: params.id },
      data: {
        isFinalized: true,
        finalizedAt: new Date(),
        status: 'COMPLETED',
      },
    });

    await db.auditLog.create({
      data: {
        tournamentId: params.id,
        action: 'TOURNAMENT_FINALIZED',
        entityType: 'Tournament',
        entityId: params.id,
        reason: 'Passed pre-flight audit checklist and officially finalized by Admin.',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        tournament: finalized,
        checklist: audit.checklist,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to finalize tournament' } },
      { status: 500 }
    );
  }
}
