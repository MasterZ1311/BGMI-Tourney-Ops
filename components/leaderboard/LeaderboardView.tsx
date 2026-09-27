'use client';

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Download,
  Printer,
  Flame,
  Filter,
  CheckCircle,
  AlertOctagon,
  RefreshCw,
} from 'lucide-react';
import { exportLeaderboardToCsv } from '@/lib/export/formatters';

export function LeaderboardView({ tournamentId }: { tournamentId: string }) {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [groups, setGroups] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const url = new URL(`/api/tournaments/${tournamentId}/leaderboard`, window.location.origin);
      if (selectedGroupId) url.searchParams.set('groupId', selectedGroupId);
      if (selectedMatchId) url.searchParams.set('matchId', selectedMatchId);

      const res = await fetch(url.toString());
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch filter options (groups and matches)
    Promise.all([
      fetch(`/api/tournaments/${tournamentId}/groups`).then((r) => r.json()),
      fetch(`/api/tournaments/${tournamentId}/matches`).then((r) => r.json()),
    ]).then(([gRes, mRes]) => {
      if (gRes.success) setGroups(gRes.data);
      if (mRes.success) setMatches(mRes.data);
    });
  }, [tournamentId]);

  useEffect(() => {
    fetchLeaderboard();
  }, [tournamentId, selectedGroupId, selectedMatchId]);

  const handleExportCsv = () => {
    if (!data || !data.standings) return;
    const csvContent = exportLeaderboardToCsv(data.standings, data.tournamentName || 'BGMI Tournament');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `BGMI_Leaderboard_${Date.now()}.csv`;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Official Tournament Leaderboard
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Rule: <strong className="text-emerald-400">{data?.scoringRuleName || 'BGIS 10-Point'}</strong> • Live derived from verified match sheets
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Export CSV
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            Print Standings
          </button>
        </div>
      </div>

      {/* Filter Selector Strip */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Filter className="w-3.5 h-3.5" />
          <span>View Scope:</span>
        </div>

        {/* Group Selector */}
        <select
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">All Groups (Overall Standings)</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>

        {/* Match Specific Filter */}
        <select
          value={selectedMatchId}
          onChange={(e) => setSelectedMatchId(e.target.value)}
          className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">Cumulative (All Matches)</option>
          {matches.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </select>

        <button
          onClick={fetchLeaderboard}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 ml-auto"
          title="Refresh Standings"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Leaderboard Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] bg-slate-950/80">
                <th className="py-3 px-4 text-center w-14">Rank</th>
                <th className="py-3 px-4">Squad Name</th>
                <th className="py-3 px-4 text-center">Matches</th>
                <th className="py-3 px-4 text-center">WWCD</th>
                <th className="py-3 px-4 text-center">Placement Pts</th>
                <th className="py-3 px-4 text-center">Kill Pts</th>
                <th className="py-3 px-4 text-center">Bonus</th>
                <th className="py-3 px-4 text-center">Penalties</th>
                <th className="py-3 px-4 text-right font-bold text-white text-sm">Total Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {data?.standings?.map((standing: any, idx: number) => {
                const isLeader = standing.rank === 1;
                const isTop3 = standing.rank <= 3;

                return (
                  <tr
                    key={standing.teamId}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isLeader
                        ? 'bg-amber-950/20 font-bold border-l-2 border-amber-400'
                        : isTop3
                        ? 'bg-slate-800/20'
                        : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3 px-4 text-center font-mono">
                      {isLeader ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-black border border-amber-500/40 text-xs">
                          1
                        </span>
                      ) : standing.rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-400/20 text-slate-300 font-bold border border-slate-400/40 text-xs">
                          2
                        </span>
                      ) : standing.rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/20 text-amber-500 font-bold border border-amber-700/40 text-xs">
                          3
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold">#{standing.rank}</span>
                      )}
                    </td>

                    {/* Squad */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{standing.teamName}</span>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold">
                          [{standing.teamTag}]
                        </span>
                      </div>
                    </td>

                    {/* Matches Played */}
                    <td className="py-3 px-4 text-center font-mono text-slate-300">
                      {standing.matchesPlayed}
                    </td>

                    {/* WWCD count */}
                    <td className="py-3 px-4 text-center">
                      {standing.wwcdCount > 0 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-400 font-mono text-xs">
                          🍗 {standing.wwcdCount}
                        </span>
                      ) : (
                        <span className="text-slate-600 font-mono">0</span>
                      )}
                    </td>

                    {/* Placement Points */}
                    <td className="py-3 px-4 text-center font-mono text-slate-300">
                      {standing.placementPoints}
                    </td>

                    {/* Kill Points */}
                    <td className="py-3 px-4 text-center font-mono text-emerald-400 font-semibold">
                      {standing.killPoints}
                    </td>

                    {/* Bonus Points */}
                    <td className="py-3 px-4 text-center font-mono text-slate-400">
                      {standing.bonusPoints > 0 ? `+${standing.bonusPoints}` : '0'}
                    </td>

                    {/* Penalties */}
                    <td className="py-3 px-4 text-center font-mono">
                      {standing.penaltyPoints > 0 ? (
                        <span className="text-rose-400 font-bold">
                          -{standing.penaltyPoints}
                        </span>
                      ) : (
                        <span className="text-slate-600">0</span>
                      )}
                    </td>

                    {/* Net Total Points */}
                    <td className="py-3 px-4 text-right font-black font-mono text-base text-emerald-400">
                      {standing.totalPoints}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
