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
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { exportLeaderboardToCsv } from '@/lib/export/formatters';

export function LeaderboardView({ tournamentId }: { tournamentId: string }) {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = new URL(`/api/tournaments/${tournamentId}/leaderboard`, window.location.origin);
      if (selectedGroupId) url.searchParams.set('groupId', selectedGroupId);
      if (selectedMatchId) url.searchParams.set('matchId', selectedMatchId);

      const res = await fetch(url.toString());
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error?.message || 'Failed to fetch leaderboard standings');
      }
    } catch (err: any) {
      console.error(err);
      setError('Network error while loading leaderboard standings');
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
          <h2 className="text-3xl font-teko uppercase font-bold tracking-wider text-white flex items-center gap-2 leading-none">
            <Trophy className="w-6 h-6 text-[#ffb60e]" />
            OFFICIAL TOURNAMENT LEADERBOARD
          </h2>
          <p className="text-xs font-condensed uppercase tracking-wider text-gray-400 mt-1">
            RULESET: <strong className="text-[#ffb60e]">{data?.scoringRuleName || 'BGIS 10-POINT SYSTEM'}</strong> • LIVE DERIVED FROM VERIFIED MATCH SHEETS
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-condensed uppercase font-bold tracking-wider bg-[#222222] hover:bg-[#ffb60e] hover:text-black text-gray-200 border border-[#444444] tactical-cut transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#ffb60e]" />
            EXPORT CSV
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-condensed uppercase font-bold tracking-wider bg-[#222222] hover:bg-[#2a2a2a] text-gray-200 border border-[#444444] tactical-cut transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-gray-400" />
            PRINT
          </button>
        </div>
      </div>

      {/* Filter Selector Strip */}
      <div className="flex flex-wrap items-center gap-3 bg-[#171716] border border-[#333333] tactical-cut p-3">
        <div className="flex items-center gap-1.5 text-xs font-condensed font-bold uppercase tracking-wider text-gray-400">
          <Filter className="w-3.5 h-3.5 text-[#ffb60e]" />
          <span>VIEW SCOPE:</span>
        </div>

        {/* Group Selector */}
        <select
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          className="bg-[#121212] border border-[#333333] text-gray-200 text-xs px-3 py-1 font-condensed font-bold uppercase focus:border-[#ffb60e] focus:outline-none"
        >
          <option value="">ALL GROUPS (OVERALL STANDINGS)</option>
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
          className="bg-[#121212] border border-[#333333] text-gray-200 text-xs px-3 py-1 font-condensed font-bold uppercase focus:border-[#ffb60e] focus:outline-none"
        >
          <option value="">CUMULATIVE (ALL MATCHES)</option>
          {matches.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </select>

        <button
          onClick={fetchLeaderboard}
          className="p-1.5 text-gray-400 hover:text-[#ffb60e] hover:bg-[#222222] ml-auto transition-colors"
          title="Refresh Standings"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Error State Banner */}
      {error && (
        <div className="p-3 tactical-cut bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 flex items-center justify-between font-condensed font-bold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchLeaderboard}
            className="px-2.5 py-1 text-[11px] font-bold bg-rose-500/30 hover:bg-rose-500/50 text-white tactical-cut transition-colors"
          >
            RETRY
          </button>
        </div>
      )}

      {/* Quick Esports Standings Overview Bar */}
      {data?.standings && data.standings.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#101010] border border-[#2e2e2e] p-3 tactical-cut">
          <div className="border-l-2 border-l-[#ffb60e] pl-3">
            <p className="text-[10px] text-gray-400 font-condensed font-bold uppercase tracking-wider">CURRENT #1 SQUAD</p>
            <p className="text-xl font-teko uppercase font-bold text-white leading-none mt-0.5">
              {data.standings[0]?.teamName || 'TBD'}
            </p>
            <span className="text-[10px] text-[#ffb60e] font-condensed font-black">
              {data.standings[0]?.totalPoints} PTS ({data.standings[0]?.wwcdCount} WWCD)
            </span>
          </div>

          <div className="border-l-2 border-l-emerald-500 pl-3">
            <p className="text-[10px] text-gray-400 font-condensed font-bold uppercase tracking-wider">TOTAL WWCDs AWARDED</p>
            <p className="text-xl font-teko uppercase font-bold text-white leading-none mt-0.5">
              {data.standings.reduce((acc: number, s: any) => acc + (s.wwcdCount || 0), 0)} WINS
            </p>
            <span className="text-[10px] text-emerald-400 font-condensed font-black">
              BATTLEGROUND VICTORIES
            </span>
          </div>

          <div className="border-l-2 border-l-rose-500 pl-3">
            <p className="text-[10px] text-gray-400 font-condensed font-bold uppercase tracking-wider">TOTAL ELIMINATIONS</p>
            <p className="text-xl font-teko uppercase font-bold text-white leading-none mt-0.5">
              {data.standings.reduce((acc: number, s: any) => acc + (s.killPoints || 0), 0)} KILLS
            </p>
            <span className="text-[10px] text-rose-400 font-condensed font-black">
              AGGRESSION POINTS
            </span>
          </div>

          <div className="border-l-2 border-l-cyan-500 pl-3">
            <p className="text-[10px] text-gray-400 font-condensed font-bold uppercase tracking-wider">ACTIVE LOBBY SQUADS</p>
            <p className="text-xl font-teko uppercase font-bold text-white leading-none mt-0.5">
              {data.standings.length} TEAMS
            </p>
            <span className="text-[10px] text-cyan-400 font-condensed font-black">
              OFFICIAL ROSTER
            </span>
          </div>
        </div>
      )}

      {/* Leaderboard Data Table */}
      <div className="hud-frame bg-[#171716] border border-[#333333] tactical-cut overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#333333] text-gray-400 font-condensed uppercase font-bold text-xs bg-[#101010]">
                <th className="py-3 px-4 text-center w-16">RANK</th>
                <th className="py-3 px-4">SQUAD NAME</th>
                <th className="py-3 px-4 text-center">MATCHES</th>
                <th className="py-3 px-4 text-center">WWCD</th>
                <th className="py-3 px-4 text-center">PLACEMENT PTS</th>
                <th className="py-3 px-4 text-center">KILL PTS</th>
                <th className="py-3 px-4 text-center">BONUS</th>
                <th className="py-3 px-4 text-center">PENALTIES</th>
                <th className="py-3 px-4 text-right font-bold text-white text-sm">TOTAL POINTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626] font-medium font-condensed">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 text-[#ffb60e] animate-spin" />
                      <span className="text-xs font-condensed uppercase font-bold text-gray-300">Computing tournament standings...</span>
                    </div>
                  </td>
                </tr>
              ) : !data?.standings || data.standings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Trophy className="w-8 h-8 text-gray-600 mb-1" />
                      <span className="font-teko uppercase text-base text-gray-300">NO STANDINGS RECORDED YET</span>
                      <span className="text-xs text-gray-500">
                        Standings will update automatically as soon as match results are published.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                data.standings.map((standing: any) => {
                  const isLeader = standing.rank === 1;
                  const isTop3 = standing.rank <= 3;

                  return (
                    <tr
                      key={standing.teamId}
                      className={`hover:bg-[#202020] transition-colors ${
                        isLeader
                          ? 'bg-[#ffb60e]/10 font-bold border-l-4 border-l-[#ffb60e]'
                          : isTop3
                          ? 'bg-[#1a1a1a]'
                          : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3 px-4 text-center font-teko">
                        {isLeader ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 tactical-cut bg-[#ffb60e] text-black font-black text-sm shadow-md shadow-[#ffb60e]/30">
                            1
                          </span>
                        ) : standing.rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 tactical-cut bg-gray-300 text-black font-black text-sm">
                            2
                          </span>
                        ) : standing.rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 tactical-cut bg-[#c57934] text-white font-black text-sm">
                            3
                          </span>
                        ) : (
                          <span className="text-gray-400 font-bold text-base">#{standing.rank}</span>
                        )}
                      </td>

                      {/* Squad with Tie-Breaker Chip */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-base leading-tight">{standing.teamName}</span>
                            <span className="text-[11px] text-[#ffb60e] font-condensed font-black">
                              [{standing.teamTag}]
                            </span>
                            {isLeader && (
                              <span className="px-2 py-0.5 tactical-cut bg-[#ffb60e] text-black font-condensed font-black text-[10px] uppercase tracking-wider shadow-sm">
                                WWCD LEADER
                              </span>
                            )}
                          </div>
                          {standing.tieBreakReason && (
                            <div className="mt-1">
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-condensed font-bold text-[#ffb60e] bg-[#ffb60e]/10 border border-[#ffb60e]/30 px-1.5 py-0.5 tactical-cut uppercase tracking-wider"
                                title={`Tie-breaker criteria: ${standing.tieBreakReason}`}
                              >
                                ⚖️ {standing.tieBreakReason}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Matches Played */}
                      <td className="py-3 px-4 text-center font-bold text-gray-300 text-sm">
                        {standing.matchesPlayed}
                      </td>

                      {/* WWCD count */}
                      <td className="py-3 px-4 text-center">
                        {standing.wwcdCount > 0 ? (
                          <span className="inline-flex items-center gap-1 font-black text-[#ffb60e] text-sm">
                            🍗 {standing.wwcdCount}
                          </span>
                        ) : (
                          <span className="text-gray-600">0</span>
                        )}
                      </td>

                      {/* Placement Points */}
                      <td className="py-3 px-4 text-center text-gray-200 font-bold text-sm">
                        {standing.placementPoints}
                      </td>

                      {/* Kill Points */}
                      <td className="py-3 px-4 text-center text-[#ffb60e] font-bold text-sm">
                        {standing.killPoints}
                      </td>

                      {/* Bonus Points */}
                      <td className="py-3 px-4 text-center text-gray-400 font-bold text-sm">
                        {standing.bonusPoints > 0 ? `+${standing.bonusPoints}` : '0'}
                      </td>

                      {/* Penalties */}
                      <td className="py-3 px-4 text-center">
                        {standing.penaltyPoints > 0 ? (
                          <span className="text-rose-400 font-bold text-sm">
                            -{standing.penaltyPoints}
                          </span>
                        ) : (
                          <span className="text-gray-600 text-sm">0</span>
                        )}
                      </td>

                      {/* Net Total Points */}
                      <td className="py-3 px-4 text-right font-teko font-black text-2xl text-[#ffb60e] tracking-wider">
                        {standing.totalPoints}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
