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
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Send,
  Radio,
} from 'lucide-react';
import { FastScoreEntryGrid } from './FastScoreEntryGrid';

export function MatchControlView({ tournamentId }: { tournamentId: string }) {
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/matches`);
      const data = await res.json();
      if (data.success && data.data) {
        setMatches(data.data);
        if (data.data.length > 0) {
          setSelectedMatchId((prev) => {
            if (prev && data.data.some((m: any) => m.id === prev)) return prev;
            const live = data.data.find((m: any) => m.status === 'LIVE');
            return live ? live.id : data.data[0].id;
          });
        }
      } else {
        setError(data.error?.message || 'Failed to retrieve matches');
      }
    } catch (err: any) {
      console.error(err);
      setError('Network error while loading matches');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [tournamentId]);

  // Keyboard navigation: Left/Right arrows to switch match tabs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.key === 'ArrowRight') {
        const idx = matches.findIndex((m) => m.id === selectedMatchId);
        if (idx !== -1 && idx < matches.length - 1) {
          setSelectedMatchId(matches[idx + 1].id);
        }
      } else if (e.key === 'ArrowLeft') {
        const idx = matches.findIndex((m) => m.id === selectedMatchId);
        if (idx > 0) {
          setSelectedMatchId(matches[idx - 1].id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [matches, selectedMatchId]);

  const activeMatch = matches.find((m) => m.id === selectedMatchId);

  // Room conflict detection: check if active match's room is occupied by another live/open match
  const roomConflictMatch = activeMatch?.room?.id
    ? matches.find(
        (m) =>
          m.id !== activeMatch.id &&
          m.room?.id === activeMatch.room?.id &&
          (m.status === 'LIVE' || m.status === 'OPEN' || m.status === 'READY')
      )
    : null;

  const handleUpdateStatus = async (status: string) => {
    if (!selectedMatchId) return;
    setError(null);
    try {
      const res = await fetch(`/api/matches/${selectedMatchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchMatches();
      } else {
        setError(data.error?.message || `Failed to transition match to ${status}`);
      }
    } catch (err: any) {
      console.error(err);
      setError(`Failed to update match status: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Match Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-teko uppercase font-bold tracking-wider text-white flex items-center gap-2 leading-none">
            <Crosshair className="w-6 h-6 text-[#ffb60e]" />
            LIVE MATCH OPERATIONS CENTER
          </h2>
          <p className="text-xs font-condensed uppercase tracking-wider text-gray-400 mt-1">
            SINGLE-SCREEN MATCH COORDINATION, ROOM DISPATCH, AND RAPID SCORE RECORDING
          </p>
        </div>

        {/* Quick Match Tab Selector with Arrow Navigation */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-condensed uppercase font-bold hidden lg:inline-block">
            KEYS: [← / →] SWITCH
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {matches.map((m) => {
              const isSelected = m.id === selectedMatchId;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMatchId(m.id)}
                  className={`px-3 py-1.5 tactical-cut text-xs font-condensed uppercase font-bold tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? 'bg-[#ffb60e] text-black font-black shadow-md shadow-[#ffb60e]/20'
                      : 'bg-[#171716] hover:bg-[#222222] text-gray-400 border border-[#333333]'
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
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-3 tactical-cut bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 flex items-center justify-between font-condensed font-bold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchMatches}
            className="px-2.5 py-1 text-[11px] font-bold bg-rose-500/30 hover:bg-rose-500/50 text-white tactical-cut transition-colors"
          >
            RETRY
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-[#171716] border border-[#333333] tactical-cut p-12 text-center text-gray-400">
          <div className="flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 text-[#ffb60e] animate-spin" />
            <span className="text-xs font-condensed uppercase font-bold text-gray-300">Loading tournament match fixtures...</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && matches.length === 0 && (
        <div className="bg-[#171716] border border-dashed border-[#333333] tactical-cut p-12 text-center">
          <Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <h4 className="text-base font-teko uppercase font-bold text-gray-300">NO MATCHES SCHEDULED</h4>
          <p className="text-xs font-condensed uppercase text-gray-500 mt-1 max-w-sm mx-auto">
            This tournament has no match fixtures. Generate fixtures or schedule matches to unlock match control and scoring.
          </p>
        </div>
      )}

      {/* Active Match Content */}
      {!isLoading && activeMatch && (
        <>
          {/* Room Conflict Alert */}
          {roomConflictMatch && (
            <div className="p-3 bg-amber-500/20 border border-amber-500/40 tactical-cut text-amber-300 text-xs flex items-center gap-2.5 font-condensed font-bold shadow-md">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                ROOM CONFLICT ALERT: Room &quot;{activeMatch.room?.roomName}&quot; is currently assigned to Match #{roomConflictMatch.matchNumber} ({roomConflictMatch.title}) which is in &quot;{roomConflictMatch.status}&quot; state! Ensure lobby slots do not overlap.
              </span>
            </div>
          )}

          {/* Active Match Status Dashboard Strip */}
          <div className={`bg-[#171716] border border-[#333333] tactical-cut p-5 shadow-2xl relative overflow-hidden ${
            activeMatch.status === 'LIVE' ? 'border-l-4 border-l-[#ffb60e]' : ''
          }`}>
            {/* Dynamic Map Background Artwork */}
            <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
              <img
                src={`/images/maps/${(activeMatch.map || 'erangel').toLowerCase()}.jpg`}
                alt=""
                className="w-full h-full object-cover object-center"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#171716] via-[#171716]/85 to-transparent" />
            </div>

            {activeMatch.status === 'LIVE' && (
              <div className="tactical-hazard-bar absolute top-0 left-0 h-1.5 w-full"></div>
            )}

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-teko uppercase font-bold tracking-wider text-white leading-none">
                    {activeMatch.title}
                  </h3>
                  <span
                    className={`text-[10px] font-condensed font-black uppercase px-2 py-0.5 tactical-cut ${
                      activeMatch.status === 'LIVE'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                        : activeMatch.status === 'COMPLETED' || activeMatch.status === 'VERIFIED'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-[#ffb60e]/15 text-[#ffb60e] border border-[#ffb60e]/40'
                    }`}
                  >
                    {activeMatch.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mt-2 font-condensed font-bold uppercase tracking-wide">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#ffb60e]" />
                    <strong className="text-white">{activeMatch.map}</strong> ({activeMatch.perspective})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <DoorOpen className="w-3.5 h-3.5 text-gray-500" />
                    ROOM: <strong className="text-[#ffb60e]">{activeMatch.room?.roomName || 'PENDING'}</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                    SCHEDULED:{' '}
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
                    className="px-4 py-1.5 text-xs font-teko uppercase font-bold tracking-wider bg-[#222222] hover:bg-[#2a2a2a] text-[#ffb60e] border border-[#ffb60e]/40 tactical-cut text-base transition-colors"
                  >
                    READY LOBBY
                  </button>
                )}

                {(activeMatch.status === 'READY' || activeMatch.status === 'SCHEDULED') && (
                  <button
                    onClick={() => handleUpdateStatus('OPEN')}
                    className="px-4 py-1.5 text-xs font-teko uppercase font-bold tracking-wider bg-[#222222] hover:bg-[#2a2a2a] text-[#ffb60e] border border-[#ffb60e]/40 tactical-cut text-base transition-colors"
                  >
                    OPEN ROOM
                  </button>
                )}

                {activeMatch.status === 'OPEN' && (
                  <button
                    onClick={() => handleUpdateStatus('LIVE')}
                    className="tactical-btn-gold text-xs font-teko font-bold text-black uppercase tracking-wider px-4 py-1.5 flex items-center gap-1.5 text-base shadow-md shadow-[#ffb60e]/20"
                  >
                    <Play className="w-4 h-4 fill-current text-black" />
                    MARK LIVE (FLIGHT)
                  </button>
                )}

                {activeMatch.status === 'LIVE' && (
                  <button
                    onClick={() => handleUpdateStatus('COMPLETED')}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-teko uppercase font-bold tracking-wider bg-rose-600 hover:bg-rose-500 text-white tactical-cut shadow-md shadow-rose-600/30 text-base transition-all"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    END MATCH (WWCD)
                  </button>
                )}

                {activeMatch.status === 'COMPLETED' && (
                  <button
                    onClick={() => {
                      const el = document.getElementById('score-entry-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="tactical-btn-gold text-xs font-teko font-bold text-black uppercase tracking-wider px-4 py-1.5 flex items-center gap-1.5 text-base shadow-sm"
                  >
                    <Calculator className="w-4 h-4 text-black" />
                    ENTER SCORES BELOW
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Embedded Rapid Score Entry Grid */}
          <div id="score-entry-section">
            <FastScoreEntryGrid
              tournamentId={tournamentId}
              matchId={activeMatch.id}
              onScoresSaved={fetchMatches}
            />
          </div>
        </>
      )}
    </div>
  );
}
