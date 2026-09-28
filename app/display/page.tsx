'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Trophy, Flame, Tv, Crosshair, MapPin, Radio, Loader2 } from 'lucide-react';

export default function PublicDisplayPage() {
  const [tournament, setTournament] = useState<any | null>(null);
  const [standings, setStandings] = useState<any[]>([]);
  const [currentMatch, setCurrentMatch] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [hasError, setHasError] = useState(false);
  const [mounted, setMounted] = useState(false);

  const fetchDisplayData = async () => {
    try {
      setHasError(false);
      const tourRes = await fetch('/api/tournaments').then((r) => r.json());
      if (tourRes.success && tourRes.data && tourRes.data.length > 0) {
        const activeT = tourRes.data[0];
        setTournament(activeT);

        const [leadRes, matchRes] = await Promise.all([
          fetch(`/api/tournaments/${activeT.id}/leaderboard`).then((r) => r.json()),
          fetch(`/api/tournaments/${activeT.id}/matches`).then((r) => r.json()),
        ]);

        if (leadRes.success && leadRes.data) {
          setStandings(leadRes.data.standings || []);
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
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchDisplayData();
    // Auto-refresh every 15 seconds for live broadcast stage display
    const interval = setInterval(fetchDisplayData, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-gray-100 p-6 lg:p-12 font-sans flex flex-col justify-between">
      {/* Top Broadcast Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#2e2e2e]">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 bg-black border-2 border-[#ffb60e] flex items-center justify-center tactical-cut shadow-xl shadow-[#ffb60e]/25 overflow-hidden p-1.5">
            <Image
              src="/images/logos/bgmi_icon.svg"
              alt="BGMI"
              width={56}
              height={56}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-condensed font-black tracking-widest text-[#ffb60e] bg-[#ffb60e]/15 px-2.5 py-0.5 tactical-cut border border-[#ffb60e]/40">
                OFFICIAL LEADERBOARD
              </span>
              <span className="flex items-center gap-1.5 text-xs text-rose-400 font-condensed font-bold uppercase tracking-wider">
                <Radio className="w-3.5 h-3.5 animate-pulse" /> LIVE BROADCAST FEED
              </span>
            </div>
            <h1 className="text-4xl font-teko uppercase font-bold text-white tracking-wider mt-1 leading-none">
              {tournament?.name || 'NO ACTIVE TOURNAMENT'}
            </h1>
          </div>
        </div>

        {/* Live Match Info Ticker */}
        {currentMatch && (
          <div className="relative overflow-hidden flex items-center gap-4 bg-[#171716] border border-[#333333] px-5 py-3 tactical-cut shadow-2xl">
            {/* Dynamic Map Background Artwork */}
            {currentMatch.map && (
              <div className="absolute inset-0 pointer-events-none opacity-25 overflow-hidden">
                <img
                  src={`/images/maps/${currentMatch.map.toLowerCase()}.jpg`}
                  alt=""
                  className="w-full h-full object-cover object-center"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#171716] via-[#171716]/85 to-transparent" />
              </div>
            )}

            <div className="relative z-10 text-right">
              <span className="text-[10px] text-gray-400 uppercase font-condensed font-bold tracking-wider block">
                {currentMatch.status === 'LIVE' ? 'LIVE NOW IN-GAME' : 'NEXT UPCOMING LOBBY'}
              </span>
              <p className="text-base font-teko uppercase font-bold text-white tracking-wider">
                {currentMatch.title} <span className="text-[#ffb60e]">•</span> {currentMatch.map}
              </p>
            </div>
            <div className="relative z-10 w-12 h-12 bg-[#101010]/90 border border-[#ffb60e]/40 tactical-cut flex items-center justify-center text-[#ffb60e] font-teko font-bold text-2xl">
              #{currentMatch.matchNumber}
            </div>
          </div>
        )}
      </div>

      {/* Main Leaderboard Stage Grid */}
      <div className="my-8 flex-1">
        <div className="bg-[#171716] border border-[#333333] tactical-cut overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#333333] text-gray-400 font-condensed text-xs uppercase tracking-wider bg-[#101010] font-bold">
                  <th className="py-4 px-6 text-center w-20">RANK</th>
                  <th className="py-4 px-6">SQUAD NAME</th>
                  <th className="py-4 px-6 text-center">MATCHES</th>
                  <th className="py-4 px-6 text-center">WWCD 🍗</th>
                  <th className="py-4 px-6 text-center">PLACEMENT PTS</th>
                  <th className="py-4 px-6 text-center">KILL PTS</th>
                  <th className="py-4 px-6 text-right font-black text-white text-sm">TOTAL POINTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626] font-semibold text-sm font-condensed">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center text-gray-400 font-condensed">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-10 h-10 text-[#ffb60e] animate-spin" />
                        <span className="text-sm font-bold uppercase tracking-wider">
                          Syncing Tournament Broadcast Feed...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : standings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center text-gray-500 font-condensed">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Trophy className="w-10 h-10 text-gray-600 mb-1" />
                        <span className="text-base font-teko uppercase font-bold text-gray-300 tracking-wider">
                          {tournament ? 'OFFICIAL STANDINGS IN PROGRESS' : 'NO ACTIVE TOURNAMENT BROADCAST'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {tournament
                            ? 'Match results will broadcast live upon referee verification.'
                            : 'Create and launch a tournament in the Control Center to broadcast live standings.'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  standings.slice(0, 16).map((standing) => {
                    const is1st = standing.rank === 1;
                    const is2nd = standing.rank === 2;
                    const is3rd = standing.rank === 3;

                    return (
                      <tr
                        key={standing.teamId}
                        className={`transition-colors ${
                          is1st
                            ? 'bg-[#ffb60e]/10 text-white border-l-4 border-l-[#ffb60e]'
                            : is2nd
                            ? 'bg-[#1e1e1e] text-gray-100'
                            : is3rd
                            ? 'bg-[#1a1a1a] text-gray-200'
                            : 'hover:bg-[#1f1f1f] text-gray-300'
                        }`}
                      >
                        <td className="py-3 px-6 text-center font-teko font-black text-lg">
                          {is1st ? (
                            <span className="inline-flex items-center justify-center w-8 h-8 tactical-cut bg-[#ffb60e] text-black">
                              1
                            </span>
                          ) : is2nd ? (
                            <span className="inline-flex items-center justify-center w-8 h-8 tactical-cut bg-gray-300 text-black">
                              2
                            </span>
                          ) : is3rd ? (
                            <span className="inline-flex items-center justify-center w-8 h-8 tactical-cut bg-[#c57934] text-white">
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
                            <span className="text-xs font-condensed font-bold text-[#ffb60e] bg-[#ffb60e]/10 px-2 py-0.5 tactical-cut border border-[#ffb60e]/30">
                              [{standing.teamTag}]
                            </span>
                            {standing.tieBreakReason && (
                              <span
                                className="text-[10px] font-condensed font-bold text-[#ffb60e] bg-[#ffb60e]/10 border border-[#ffb60e]/30 px-1.5 py-0.5 tactical-cut uppercase tracking-wider"
                                title={`Tiebreak: ${standing.tieBreakReason}`}
                              >
                                ⚖️ {standing.tieBreakReason}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-6 text-center font-bold text-gray-400">
                          {standing.matchesPlayed}
                        </td>

                        <td className="py-3 px-6 text-center font-black text-[#ffb60e]">
                          {standing.wwcdCount > 0 ? `🍗 ${standing.wwcdCount}` : '—'}
                        </td>

                        <td className="py-3 px-6 text-center text-gray-300 font-bold">
                          {standing.placementPoints}
                        </td>

                        <td className="py-3 px-6 text-center text-[#ffb60e] font-bold">
                          {standing.killPoints}
                        </td>

                        <td className="py-3 px-6 text-right font-black text-2xl text-[#ffb60e]">
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

      {/* Footer Ticker */}
      <div className="pt-4 border-t border-[#2e2e2e] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-500 font-condensed uppercase tracking-wider font-bold">
        <span>BATTLEGROUNDS MOBILE INDIA • OFFICIAL TOURNAMENT CONTROL CENTER</span>
        <div className="flex items-center gap-2">
          {hasError ? (
            <span className="text-rose-400 flex items-center gap-1">
              ● FEED RECONNECTING (15S POLLING)
            </span>
          ) : (
            <span className="text-[#ffb60e] flex items-center gap-1" suppressHydrationWarning>
              ● LIVE SYNCED ({mounted && lastRefreshed ? lastRefreshed.toLocaleTimeString() : 'LIVE FEED READY'})
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
