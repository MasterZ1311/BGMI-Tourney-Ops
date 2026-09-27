import { db } from '@/lib/db';
import { TournamentCreateSchema } from '@/lib/validation/schemas';
import { BGIS_10_POINT_SYSTEM } from '@/lib/scoring/presets';
import { apiSuccess, handleRouteError } from '@/lib/services/api-response';

export async function GET() {
  try {
    const tournaments = await db.tournament.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            teams: true,
            matches: true,
          },
        },
      },
    });

    return apiSuccess(tournaments);
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to fetch tournaments', '/api/tournaments');
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = TournamentCreateSchema.parse(body);

    const tournament = await db.tournament.create({
      data: {
        name: validated.name,
        organizer: validated.organizer,
        description: validated.description,
        format: validated.format,
        startDate: new Date(validated.startDate),
        endDate: new Date(validated.endDate),
        venue: validated.venue,
        contactEmail: validated.contactEmail || undefined,
        settings: {
          create: {
            totalTeamsCap: validated.settings?.totalTeamsCap ?? 64,
            squadSize: validated.settings?.squadSize ?? 4,
            substitutesCap: validated.settings?.substitutesCap ?? 2,
            maxTeamsPerGroup: validated.settings?.maxTeamsPerGroup ?? 16,
            matchDurationMinutes: validated.settings?.matchDurationMinutes ?? 30,
            breakDurationMinutes: validated.settings?.breakDurationMinutes ?? 15,
            noShowGraceMinutes: validated.settings?.noShowGraceMinutes ?? 10,
            disputeWindowMinutes: validated.settings?.disputeWindowMinutes ?? 15,
            allowSubstitutions: validated.settings?.allowSubstitutions ?? true,
            rulesMarkdown: validated.settings?.rulesMarkdown,
          },
        },
        scoringRule: {
          create: {
            name: validated.scoringRule?.name ?? BGIS_10_POINT_SYSTEM.name,
            placementPoints: JSON.stringify(
              validated.scoringRule?.placementPoints ?? BGIS_10_POINT_SYSTEM.placementPoints
            ),
            killPointsPerElim: validated.scoringRule?.killPointsPerElim ?? BGIS_10_POINT_SYSTEM.killPointsPerElim,
            wwcdBonus: validated.scoringRule?.wwcdBonus ?? BGIS_10_POINT_SYSTEM.wwcdBonus,
            tieBreakers: JSON.stringify(
              validated.scoringRule?.tieBreakers ?? BGIS_10_POINT_SYSTEM.tieBreakers
            ),
          },
        },
      },
      include: {
        settings: true,
        scoringRule: true,
      },
    });

    await db.auditLog.create({
      data: {
        tournamentId: tournament.id,
        action: 'TOURNAMENT_CREATED',
        entityType: 'Tournament',
        entityId: tournament.id,
        afterState: JSON.stringify({ name: tournament.name, format: tournament.format }),
        reason: 'Initial creation via wizard',
      },
    });

    return apiSuccess(tournament, { status: 201 });
  } catch (error: unknown) {
    return handleRouteError(error, 'Failed to create tournament', '/api/tournaments');
  }
}
