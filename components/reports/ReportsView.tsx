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
          <h2 className="text-2xl font-heading font-black tracking-wider text-white uppercase flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#ffb60e]" />
            Tournament Reports & Data Export Center
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">
            Export authoritative competition data for broadcasters, sponsors, and community archives
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="tactical-cut bg-[#1c1c1c] hover:bg-[#282828] text-slate-200 border border-white/10 px-4 py-2 font-heading font-black tracking-wider uppercase text-xs flex items-center gap-2 transition-all"
        >
          <Printer className="w-4 h-4 text-[#ffb60e]" />
          Print / PDF Export
        </button>
      </div>

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="tactical-cut bg-[#121212] border border-white/10 p-6 shadow-xl space-y-4 hover:border-[#ffb60e]/30 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 tactical-cut bg-[#ffb60e]/15 border border-[#ffb60e]/30 flex items-center justify-center text-[#ffb60e]">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-heading font-bold text-white uppercase tracking-wide">Cumulative Standings</h3>
              <p className="text-xs text-[#ffb60e] font-mono">Official Leaderboard</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Export all ranked squads, total points, WWCDs, placement points, and kill points with tie-breakers.
          </p>
          <button
            onClick={handleExportStandings}
            className="tactical-btn-gold w-full flex items-center justify-center gap-2 py-2.5 text-xs font-heading font-black tracking-wider uppercase shadow-lg shadow-[#ffb60e]/15"
          >
            <Download className="w-4 h-4" />
            Download Standings CSV
          </button>
        </div>

        <div className="tactical-cut bg-[#121212] border border-white/10 p-6 shadow-xl space-y-4 hover:border-white/20 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 tactical-cut bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-heading font-bold text-white uppercase tracking-wide">Full Squad Rosters</h3>
              <p className="text-xs text-cyan-400 font-mono">Player UIDs & Roles</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Complete roster dump with team tags, in-game names (IGNs), numeric character IDs, and bench substitutes.
          </p>
          <button
            onClick={handleExportRosters}
            className="tactical-cut bg-[#1c1c1c] hover:bg-[#282828] text-slate-200 border border-white/10 w-full flex items-center justify-center gap-2 py-2.5 text-xs font-heading font-black tracking-wider uppercase transition-all"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            Download Rosters CSV
          </button>
        </div>

        <div className="tactical-cut bg-[#121212] border border-white/10 p-6 shadow-xl space-y-4 hover:border-white/20 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 tactical-cut bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-heading font-bold text-white uppercase tracking-wide">Attendance Audit</h3>
              <p className="text-xs text-emerald-400 font-mono">Lobby Check-In Records</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Timestamped marshal logs showing squad presence, late check-in penalties, and absent notifications.
          </p>
          <button
            onClick={() => window.print()}
            className="tactical-cut bg-[#1c1c1c] hover:bg-[#282828] text-slate-200 border border-white/10 w-full flex items-center justify-center gap-2 py-2.5 text-xs font-heading font-black tracking-wider uppercase transition-all"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            Print Check-In Sheet
          </button>
        </div>
      </div>
    </div>
  );
}
