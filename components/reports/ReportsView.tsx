'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Download, Printer, Users, Trophy, UserCheck, Shield } from 'lucide-react';
import { exportLeaderboardToCsv, exportRostersToCsv } from '@/lib/export/formatters';

export function ReportsView({ tournamentId }: { tournamentId: string }) {
  const [tournament, setTournament] = useState<any | null>(null);
  const [standings, setStandings] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/tournaments/${tournamentId}`).then((r) => r.json()),
      fetch(`/api/tournaments/${tournamentId}/leaderboard`).then((r) => r.json()),
      fetch(`/api/tournaments/${tournamentId}/teams`).then((r) => r.json()),
    ]).then(([tRes, lRes, tmRes]) => {
      if (tRes.success) setTournament(tRes.data);
      if (lRes.success) setStandings(lRes.data.standings);
      if (tmRes.success) setTeams(tmRes.data);
    });
  }, [tournamentId]);

  const handleExportStandings = () => {
    if (!standings.length) return;
    const csv = exportLeaderboardToCsv(standings, tournament?.name || 'Tournament');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${tournament?.name || 'BGMI'}_Standings.csv`;
    link.click();
  };

  const handleExportRosters = () => {
    if (!teams.length) return;
    const csv = exportRostersToCsv(teams);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${tournament?.name || 'BGMI'}_Rosters.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            Tournament Reports & Data Export Center
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Export authoritative competition data for broadcasters, sponsors, and community archives
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
        >
          <Printer className="w-3.5 h-3.5 text-blue-400" />
          Print / PDF Export
        </button>
      </div>

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Cumulative Standings</h3>
              <p className="text-xs text-slate-400 font-mono">Official Leaderboard</p>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Export all ranked squads, total points, WWCDs, placement points, and kill points with tie-breakers.
          </p>
          <button
            onClick={handleExportStandings}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Download Standings CSV
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Full Squad Rosters</h3>
              <p className="text-xs text-slate-400 font-mono">Player UIDs & Roles</p>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Complete roster dump with team tags, in-game names (IGNs), numeric character IDs, and bench substitutes.
          </p>
          <button
            onClick={handleExportRosters}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            Download Rosters CSV
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Attendance Audit</h3>
              <p className="text-xs text-slate-400 font-mono">Lobby Check-In Records</p>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Timestamped marshal logs showing squad presence, late check-in penalties, and absent notifications.
          </p>
          <button
            onClick={() => window.print()}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            Print Check-In Sheet
          </button>
        </div>
      </div>
    </div>
  );
}
