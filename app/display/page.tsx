'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Flame, Tv, Crosshair, MapPin, Radio } from 'lucide-react';

export default function PublicDisplayPage() {
  const [tournament, setTournament] = useState<any | null>(null);
  const [standings, setStandings] = useState<any[]>([]);
  const [currentMatch, setCurrentMatch] = useState<any | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchDisplayData = async () => {
    try {
      const tourRes = await fetch('/api/tournaments').then((r) => r.json());
      if (tourRes.success && tourRes.data && tourRes.data.length > 0) {
        const activeT = tourRes.data[0];
        setTournament(activeT);

        const [leadRes, matchRes] = await Promise.all([
          fetch(`/api/tournaments/${activeT.id}/leaderboard`).then((r) => r.json()),
          fetch(`/api/tournaments/${activeT.id}/matches`).then((r) => r.json()),
        ]);

        if (leadRes.success && leadRes.data) {
          setStandings(leadRes.data.standings);
        }

        if (matchRes.success && matchRes.data) {
          const live = matchRes.data.find((m: any) => m.status === 'LIVE');
          const next = matchRes.data.find((m: any) => m.status === 'SCHEDULED' || m.status === 'READY');
          setCurrentMatch(live || next || matchRes.data[0]);
        }

        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error('Failed to update public display', err);
    }
  };

  useEffect(() => {
    fetchDisplayData();
    // Auto-refresh every 15 seconds for live broadcast stage display
    const interval = setInterval(fetchDisplayData, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 p-6 lg:p-12 font-sans flex flex-col justify-between">
      {/* Top Broadcast Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Official Leaderboard
              </span>
              <span className="flex items-center gap-1 text-[11px] text-rose-400 font-mono font-bold uppercase">
                <Radio className="w-3 h-3 animate-pulse" /> LIVE STAGE FEED
              </span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight mt-1">
              {tournament?.name || 'BGMI Invitational Championship'}
            </h1>
          </div>
        </div>

        {/* Live Match Info Ticker */}
        {currentMatch && (
          <div className="flex items-center gap-4 bg-slate-900/90 border border-slate-800 px-5 py-3 rounded-2xl shadow-xl">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">
                {currentMatch.status === 'LIVE' ? 'LIVE NOW IN-GAME' : 'NEXT UPCOMING LOBBY'}
              </span>
              <p className="text-sm font-extrabold text-white">
                {currentMatch.title} • {currentMatch.map}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-mono font-black text-base">
              #{currentMatch.matchNumber}
            </div>
          </div>
        )}
      </div>

      {/* Main Leaderboard Stage Grid */}
      <div className="my-8 flex-1">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-xs uppercase tracking-wider bg-slate-950/80">
                  <th className="py-4 px-6 text-center w-20">Rank</th>
                  <th className="py-4 px-6">Squad Name</th>
                  <th className="py-4 px-6 text-center">Matches</th>
                  <th className="py-4 px-6 text-center">WWCD 🍗</th>
                  <th className="py-4 px-6 text-center">Placement Pts</th>
                  <th className="py-4 px-6 text-center">Kill Pts</th>
                  <th className="py-4 px-6 text-right font-black text-white text-sm">Total Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-semibold text-sm">
                {standings.slice(0, 16).map((standing) => {
                  const is1st = standing.rank === 1;
                  const is2nd = standing.rank === 2;
                  const is3rd = standing.rank === 3;

                  return (
                    <tr
                      key={standing.teamId}
                      className={`transition-colors ${
                        is1st
                          ? 'bg-amber-950/30 text-amber-200 border-l-4 border-amber-400'
                          : is2nd
                          ? 'bg-slate-800/40 text-slate-100'
                          : is3rd
                          ? 'bg-amber-900/15 text-slate-200'
                          : 'hover:bg-slate-800/30 text-slate-300'
                      }`}
                    >
                      <td className="py-3 px-6 text-center font-mono font-black text-base">
                        {is1st ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                            1
                          </span>
                        ) : is2nd ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-400/20 text-slate-300 border border-slate-400/40">
                            2
                          </span>
                        ) : is3rd ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-700/20 text-amber-500 border border-amber-700/40">
                            3
                          </span>
                        ) : (
                          `#${standing.rank}`
                        )}
                      </td>

                      <td className="py-3 px-6">
                        <div className="flex items-center gap-3">
                          <span className="text-base font-extrabold text-white">
                            {standing.teamName}
                          </span>
                          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            [{standing.teamTag}]
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-6 text-center font-mono text-slate-400">
                        {standing.matchesPlayed}
                      </td>

                      <td className="py-3 px-6 text-center font-mono font-bold text-amber-400">
                        {standing.wwcdCount > 0 ? `🍗 ${standing.wwcdCount}` : '—'}
                      </td>

                      <td className="py-3 px-6 text-center font-mono text-slate-300">
                        {standing.placementPoints}
                      </td>

                      <td className="py-3 px-6 text-center font-mono text-emerald-400">
                        {standing.killPoints}
                      </td>

                      <td className="py-3 px-6 text-right font-black font-mono text-xl text-emerald-400">
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

      {/* Footer Ticker */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-mono">
        <span>BATTLEGROUNDS MOBILE INDIA • OFFICIAL TOURNAMENT CONTROL CENTER</span>
        <span>Auto-synced at {lastRefreshed.toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
