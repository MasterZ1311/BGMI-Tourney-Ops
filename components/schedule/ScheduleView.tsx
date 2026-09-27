'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  PlusCircle,
  Clock,
  MapPin,
  DoorOpen,
  CheckCircle,
  AlertTriangle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { TournamentTab } from '../shared/TournamentSubNav';

export function ScheduleView({
  tournamentId,
  onNavigateTab,
}: {
  tournamentId: string;
  onNavigateTab?: (tab: TournamentTab) => void;
}) {
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/matches`);
      const data = await res.json();
      if (data.success) {
        setMatches(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [tournamentId]);

  const handleGenerateBatch = async () => {
    if (!confirm('Generate 5 sequential BGMI matches with full Erangel, Miramar, Sanhok, Vikendi, Rondo map rotation?')) return;
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generateBatch: true,
          matchCount: 5,
          startTime: new Date().toISOString(),
          matchDurationMinutes: 30,
          breakDurationMinutes: 15,
          maps: ['ERANGEL', 'MIRAMAR', 'SANHOK', 'VIKENDI', 'RONDO'],
        }),
      });

      const data = await res.json();
      if (data.success) {
        fetchMatches();
      } else {
        setError(data.error?.message || 'Failed to generate schedule');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-teko uppercase font-bold tracking-wider text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#ffb60e]" />
            MATCH SCHEDULER & TIMELINE
          </h2>
          <p className="text-xs font-condensed uppercase tracking-wider text-gray-400 mt-0.5">
            TIMETABLE WITH AUTOMATED MAP ROTATIONS (ERANGEL, MIRAMAR, SANHOK, VIKENDI, RONDO) AND CONFLICT-FREE SLOTS
          </p>
        </div>

        <button
          onClick={handleGenerateBatch}
          disabled={isGenerating}
          className="tactical-btn-gold text-xs font-teko font-bold text-black uppercase tracking-wider px-4 py-2 flex items-center gap-1.5 text-base shadow-lg shadow-[#ffb60e]/20 disabled:opacity-50"
        >
          <PlusCircle className="w-4 h-4 text-black" />
          {isGenerating ? 'GENERATING...' : 'BATCH GENERATE SCHEDULE (5 MAPS)'}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Match Timeline Cards */}
      <div className="space-y-3">
        {matches.length === 0 ? (
          <div className="text-center py-12 bg-[#171716] border border-[#333333] tactical-cut">
            <Calendar className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <p className="text-base font-teko uppercase font-bold text-gray-300">NO MATCHES SCHEDULED</p>
            <p className="text-xs font-condensed uppercase tracking-wider text-gray-500 mt-1 max-w-sm mx-auto">
              GENERATE A SEQUENTIAL TIMETABLE OR ADD MATCHES MANUALLY TO BEGIN LOBBY OPERATIONS.
            </p>
          </div>
        ) : (
          matches.map((match) => (
            <div
              key={match.id}
              className={`relative overflow-hidden p-4 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 tactical-cut ${
                match.status === 'LIVE'
                  ? 'bg-[#171716] border-l-4 border-l-[#ffb60e] border-[#333333] shadow-lg shadow-[#ffb60e]/10'
                  : 'bg-[#171716] border-[#333333] hover:border-gray-600'
              }`}
            >
              {/* Dynamic Map Background Artwork */}
              <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
                <img
                  src={`/images/maps/${match.map.toLowerCase()}.jpg`}
                  alt=""
                  className="w-full h-full object-cover object-center"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#171716] via-[#171716]/80 to-transparent" />
              </div>

              <div className="relative z-10 flex items-start gap-4">
                <div className="w-14 h-14 bg-[#121212] border border-[#333333] flex flex-col items-center justify-center text-center tactical-cut">
                  <span className="text-[10px] uppercase font-condensed font-bold text-gray-500">SLOT</span>
                  <span className="text-2xl font-teko font-bold text-[#ffb60e] leading-none">#{match.matchNumber}</span>
                </div>

                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-teko uppercase font-bold tracking-wider text-white">{match.title}</h3>
                    <span
                      className={`text-[10px] font-condensed font-black uppercase px-2 py-0.5 tactical-cut ${
                        match.status === 'LIVE'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                          : match.status === 'COMPLETED' || match.status === 'VERIFIED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-[#ffb60e]/15 text-[#ffb60e] border border-[#ffb60e]/40'
                      }`}
                    >
                      {match.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-1 font-condensed font-semibold uppercase">
                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-[#121212] border border-[#333333] text-gray-300">
                      <MapPin className="w-3.5 h-3.5 text-[#ffb60e]" />
                      <strong className="text-white">{match.map}</strong> ({match.perspective})
                    </span>
                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-[#121212] border border-[#333333] text-gray-300">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      {new Date(match.scheduledStartTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-[#121212] border border-[#333333] text-gray-300">
                      <DoorOpen className="w-3.5 h-3.5 text-gray-500" />
                      {match.room?.roomName || 'ROOM PENDING'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status & Actions */}
              <div className="flex items-center gap-3 justify-end pt-2 md:pt-0 border-t md:border-t-0 border-[#2e2e2e]">
                <span className="text-xs font-condensed uppercase tracking-wider text-gray-400">
                  RESULTS: <strong className="text-[#ffb60e] font-bold">{match.resultStatus}</strong>
                </span>

                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('matches')}
                    className="px-4 py-1.5 text-xs font-teko uppercase font-bold tracking-wider bg-[#222222] hover:bg-[#ffb60e] hover:text-black border border-[#444444] text-gray-200 transition-colors tactical-cut text-sm"
                  >
                    OPEN CONTROL
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
