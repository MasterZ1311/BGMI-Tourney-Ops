import { db } from '@/lib/db';
import { TeamBulkImportSchema } from '@/lib/validation/schemas';
import { apiSuccess, apiError, handleRouteError } from '@/lib/services/api-response';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validated = TeamBulkImportSchema.parse(body);
    const { rows, dryRun = false } = validated;

    const validationErrors: Array<{ rowNumber: number; team: string; error: string }> = [];
    const validTeams: any[] = [];
    const seenTeamNames = new Set<string>();
    const seenPlayerUids = new Set<string>();

    // Fetch existing teams and character IDs in this tournament to prevent collisions
    const existingTeams = await db.team.findMany({
      where: { tournamentId: params.id },
      include: { players: true },
    });

    for (const t of existingTeams) {
      seenTeamNames.add(t.name.toLowerCase());
      for (const p of t.players) {
        seenPlayerUids.add(p.characterId);
      }
    }

    rows.forEach((row, idx) => {
      const rowNum = idx + 1;
      const teamName = row.teamName?.trim();
      const tag = row.tag?.trim();

      if (!teamName) {
        validationErrors.push({ rowNumber: rowNum, team: 'Unknown', error: 'Missing Team Name' });
        return;
      }

      if (!tag) {
        validationErrors.push({ rowNumber: rowNum, team: teamName, error: 'Missing Team Tag' });
        return;
      }

      if (seenTeamNames.has(teamName.toLowerCase())) {
        validationErrors.push({
          rowNumber: rowNum,
          team: teamName,
          error: `Duplicate Team Name "${teamName}" already exists.`,
        });
        return;
      }
      seenTeamNames.add(teamName.toLowerCase());

      // Validate players (at least 4 players required)
      const players = [
        { name: row.p1Name || row.p1Ign, ign: row.p1Ign, characterId: row.p1Id, role: 'CAPTAIN' as const },
        { name: row.p2Name || row.p2Ign, ign: row.p2Ign, characterId: row.p2Id, role: 'ASSAULTER' as const },
        { name: row.p3Name || row.p3Ign, ign: row.p3Ign, characterId: row.p3Id, role: 'SUPPORT' as const },
        { name: row.p4Name || row.p4Ign, ign: row.p4Ign, characterId: row.p4Id, role: 'ASSAULTER' as const },
      ];

      for (let pIdx = 0; pIdx < players.length; pIdx++) {
        const p = players[pIdx];
        if (!p.ign || !p.characterId) {
          validationErrors.push({
            rowNumber: rowNum,
            team: teamName,
            error: `Player ${pIdx + 1} is missing IGN or Character ID.`,
          });
          return;
        }

        if (seenPlayerUids.has(p.characterId)) {
          validationErrors.push({
            rowNumber: rowNum,
            team: teamName,
            error: `Player UID ${p.characterId} (${p.ign}) is already registered on another team.`,
          });
          return;
        }
        seenPlayerUids.add(p.characterId);
      }

      const teamRoster = players.map((p) => ({
        ...p,
        isSubstitute: false,
        isVerified: true,
      }));

      // Substitute if provided
      if (row.subIgn && row.subId) {
        if (seenPlayerUids.has(row.subId)) {
          validationErrors.push({
            rowNumber: rowNum,
            team: teamName,
            error: `Substitute UID ${row.subId} (${row.subIgn}) is already registered.`,
          });
          return;
        }
        seenPlayerUids.add(row.subId);

        teamRoster.push({
          name: row.subIgn,
          ign: row.subIgn,
          characterId: row.subId,
          role: 'SUPPORT',
          isSubstitute: true,
          isVerified: true,
        });
      }

      validTeams.push({
        name: teamName,
        tag: tag.toUpperCase(),
        captainName: row.captainName || row.p1Ign,
        players: teamRoster,
      });
    });

    if (dryRun) {
      return apiSuccess({
        totalRows: rows.length,
        validCount: validTeams.length,
        invalidCount: validationErrors.length,
        errors: validationErrors,
        preview: validTeams.slice(0, 5),
      });
    }

    if (validationErrors.length > 0 && validTeams.length === 0) {
      return apiError('All rows had validation errors. Import aborted.', {
        status: 400,
        code: 'BULK_IMPORT_VALIDATION_FAILED',
        details: validationErrors,
        path: `/api/tournaments/${params.id}/teams/import`,
      });
    }

    // Persist valid teams in database
    const created = [];
    for (const item of validTeams) {
      const team = await db.team.create({
        data: {
          tournamentId: params.id,
          name: item.name,
          tag: item.tag,
          captainName: item.captainName,
          verificationStatus: 'VERIFIED',
          status: 'ACTIVE',
          players: {
            create: item.players,
          },
          attendances: {
            create: {
              tournamentId: params.id,
              status: 'ABSENT',
            },
          },
        },
      });
      created.push(team);
    }

    await db.auditLog.create({
      data: {
        tournamentId: params.id,
        action: 'TEAMS_BULK_IMPORTED',
        entityType: 'Team',
        entityId: params.id,
        reason: `Bulk imported ${created.length} teams. ${validationErrors.length} errors skipped.`,
      },
    });

    return apiSuccess({
      importedCount: created.length,
      skippedCount: validationErrors.length,
      errors: validationErrors,
    }, { status: 200 });
  } catch (error: unknown) {
    return handleRouteError(error, 'Bulk import failed', `/api/tournaments/${params.id}/teams/import`);
  }
}
