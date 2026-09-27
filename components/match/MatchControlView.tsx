'use client';

import React, { useState, useEffect } from 'react';
import {
  Crosshair,
  Play,
  CheckCircle,
  DoorOpen,
  Calculator,
  Square,
  Clock,
  MapPin,
  Users,
} from 'lucide-react';
import { FastScoreEntryGrid } from './FastScoreEntryGrid';

export function MatchControlView({ tournamentId }: { tournamentId: string }) {
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMatches = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/matches`);
      const data = await res.json();
      if (data.success && data.data) {
        setMatches(data.data);
        if (!selectedMatchId && data.data.length > 0) {
          // Select live match or first match
          const live = data.data.find((m: any) => m.status === 'LIVE');
          setSelectedMatchId(live ? live.id : data.data[0].id);
        }
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

  const activeMatch = matches.find((m) => m.id === selectedMatchId);

  const handleUpdateStatus = async (status: string) => {
    if (!selectedMatchId) return;
    try {
      const res = await fetch(`/api/matches/${selectedMatchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchMatches();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Match Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-emerald-400" />
            Live Match Operations Center
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Single-screen match coordination, room dispatch, and rapid score recording
          </p>
        </div>

        {/* Quick Match Tab Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {matches.map((m) => {
            const isSelected = m.id === selectedMatchId;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMatchId(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
              >
                <span>M#{m.matchNumber}</span>
                {m.status === 'LIVE' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {activeMatch && (
        <>
          {/* Active Match Status Dashboard Strip */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white">{activeMatch.title}</h3>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                      activeMatch.status === 'LIVE'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                        : activeMatch.status === 'COMPLETED' || activeMatch.status === 'VERIFIED'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                    }`}
                  >
                    {activeMatch.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2 font-mono">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {activeMatch.map} ({activeMatch.perspective})
                  </span>
                  <span className="flex items-center gap-1">
                    <DoorOpen className="w-3.5 h-3.5 text-slate-500" />
                    Room: <strong className="text-white">{activeMatch.room?.roomName || 'Pending'}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Scheduled:{' '}
                    {new Date(activeMatch.scheduledStartTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {/* Match Operations Transition Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {activeMatch.status === 'SCHEDULED' && (
                  <button
                    onClick={() => handleUpdateStatus('READY')}
                    className="px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                  >
                    Ready Lobby
                  </button>
                )}

                {(activeMatch.status === 'READY' || activeMatch.status === 'SCHEDULED') && (
                  <button
                    onClick={() => handleUpdateStatus('OPEN')}
                    className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm transition-all"
                  >
                    Open Room
                  </button>
                )}

                {activeMatch.status === 'OPEN' && (
                  <button
                    onClick={() => handleUpdateStatus('LIVE')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-md shadow-emerald-600/30 transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Mark Live (Flight)
                  </button>
                )}

                {activeMatch.status === 'LIVE' && (
                  <button
                    onClick={() => handleUpdateStatus('COMPLETED')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-md shadow-rose-600/30 transition-all"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    End Match (WWCD)
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Embedded Rapid Score Entry Grid */}
          <FastScoreEntryGrid
            tournamentId={tournamentId}
            matchId={activeMatch.id}
            onScoresSaved={fetchMatches}
          />
        </>
      )}
    </div>
  );
}
