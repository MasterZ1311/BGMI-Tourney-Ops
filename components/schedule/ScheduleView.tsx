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
    if (!confirm('Generate 4 sequential BGMI matches with standard Erangel, Miramar, Sanhok, Vikendi map rotation?')) return;
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generateBatch: true,
          matchCount: 4,
          startTime: new Date().toISOString(),
          matchDurationMinutes: 30,
          breakDurationMinutes: 15,
          maps: ['ERANGEL', 'MIRAMAR', 'SANHOK', 'VIKENDI'],
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
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            Match Scheduler & Timeline
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Timetable with automated map rotations and conflict-free room slots
          </p>
        </div>

        <button
          onClick={handleGenerateBatch}
          disabled={isGenerating}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          {isGenerating ? 'Generating...' : 'Batch Generate Schedule'}
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
          <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl">
            <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-300">No Matches Scheduled</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Generate a sequential timetable or add matches manually to begin lobby operations.
            </p>
          </div>
        ) : (
          matches.map((match) => (
            <div
              key={match.id}
              className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                match.status === 'LIVE'
                  ? 'bg-slate-900/90 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Slot</span>
                  <span className="text-base font-black text-emerald-400">#{match.matchNumber}</span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{match.title}</h3>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                        match.status === 'LIVE'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                          : match.status === 'COMPLETED' || match.status === 'VERIFIED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                      }`}
                    >
                      {match.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {match.map} ({match.perspective})
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(match.scheduledStartTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <DoorOpen className="w-3.5 h-3.5 text-slate-500" />
                      {match.room?.roomName || 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status & Actions */}
              <div className="flex items-center gap-3 justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                <span className="text-xs font-mono text-slate-400">
                  Results: <strong className="text-amber-400">{match.resultStatus}</strong>
                </span>

                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('matches')}
                    className="px-3 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                  >
                    Open Control
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
