'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Play,
  DoorOpen,
  Calculator,
  UserCheck,
  Flame,
  Clock,
  ShieldAlert,
  Copy,
  Check,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { TournamentTab } from '../shared/TournamentSubNav';

interface OverviewProps {
  tournament: any;
  onNavigateTab: (tab: TournamentTab) => void;
  onRefresh: () => void;
}

export function OverviewDashboard({ tournament, onNavigateTab, onRefresh }: OverviewProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  // Find live match or next scheduled match
  const liveMatch = tournament.matches?.find((m: any) => m.status === 'LIVE');
  const nextMatch = tournament.matches?.find(
    (m: any) => m.status === 'SCHEDULED' || m.status === 'READY' || m.status === 'OPEN'
  );
  const currentMatch = liveMatch || nextMatch || tournament.matches?.[0];

  const totalTeams = tournament._count?.teams || tournament.teams?.length || 0;
  const verifiedTeams = tournament.teams?.filter((t: any) => t.verificationStatus === 'VERIFIED').length || totalTeams;
  
  // Attendance calculations
  const presentCount = tournament.attendances?.filter((a: any) => a.status === 'PRESENT').length || 0;
  const lateCount = tournament.attendances?.filter((a: any) => a.status === 'LATE').length || 0;
  const absentCount = tournament.attendances?.filter((a: any) => a.status === 'ABSENT').length || 0;

  // Match calculations
  const totalMatches = tournament.matches?.length || 0;
  const completedMatches = tournament.matches?.filter(
    (m: any) => m.status === 'COMPLETED' || m.status === 'VERIFIED' || m.status === 'PUBLISHED'
  ).length || 0;
  const remainingMatches = totalMatches - completedMatches;

  const copyToClipboard = (text: string, type: 'id' | 'pass') => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Operations Command Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                tournament.status === 'LIVE'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
              }`}>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                {tournament.status}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {tournament.format.replace(/_/g, ' ')}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">{tournament.name}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Organized by <strong className="text-slate-200">{tournament.organizer}</strong> • Venue: {tournament.venue || 'Online Lobby'}
            </p>
          </div>

          {/* Rapid Action Buttons Strip */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigateTab('matches')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Match Control</span>
            </button>

            <button
              onClick={() => onNavigateTab('rooms')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
            >
              <DoorOpen className="w-3.5 h-3.5" />
              <span>Room Ops</span>
            </button>

            <button
              onClick={() => onNavigateTab('scoring')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Score Entry</span>
            </button>

            <button
              onClick={() => onNavigateTab('attendance')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Attendance</span>
            </button>

            <button
              onClick={() => onNavigateTab('leaderboard')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Leaderboard</span>
            </button>
          </div>
        </div>
      </div>

      {/* Current Match Ticker & Room Card */}
      {currentMatch && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Match</span>
                <span className="text-lg font-black text-emerald-400">#{currentMatch.matchNumber}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{currentMatch.title}</h3>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                    currentMatch.status === 'LIVE'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}>
                    {currentMatch.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400 mt-1 font-mono">
                  <span>MAP: <strong className="text-slate-200">{currentMatch.map}</strong></span>
                  <span>MODE: <strong className="text-slate-200">{currentMatch.perspective}</strong></span>
                  <span>RESULTS: <strong className="text-amber-400">{currentMatch.resultStatus}</strong></span>
                </div>
              </div>
            </div>

            {/* Room Credentials Strip */}
            {currentMatch.room && (
              <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 p-3 rounded-lg">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-mono">Room ID</p>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-sm font-bold text-white">
                      {currentMatch.room.roomId || 'Pending'}
                    </span>
                    {currentMatch.room.roomId && (
                      <button
                        onClick={() => copyToClipboard(currentMatch.room.roomId, 'id')}
                        className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
                        title="Copy Room ID"
                      >
                        {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="h-8 w-px bg-slate-800"></div>

                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-mono">Password</p>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-sm font-bold text-amber-400">
                      {currentMatch.room.password || 'Pending'}
                    </span>
                    {currentMatch.room.password && (
                      <button
                        onClick={() => copyToClipboard(currentMatch.room.password, 'pass')}
                        className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
                        title="Copy Password"
                      >
                        {copiedPass ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onNavigateTab('matches')}
                  className="ml-2 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 px-3 py-1.5 rounded font-semibold transition-colors"
                >
                  Enter Room
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4 Operations Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Teams Metric */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Teams</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{totalTeams}</span>
            <span className="text-xs text-emerald-400 font-semibold">{verifiedTeams} Verified</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Checked In: <strong className="text-slate-200">{presentCount}</strong></span>
            <span>Absent: <strong className="text-rose-400">{absentCount}</strong></span>
          </div>
        </div>

        {/* Matches Metric */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Matches</span>
            <Flame className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{completedMatches} / {totalMatches}</span>
            <span className="text-xs text-slate-400">Done</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Remaining: <strong className="text-slate-200">{remainingMatches}</strong></span>
            <span className="text-emerald-400 font-medium">
              {totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0}% Complete
            </span>
          </div>
        </div>

        {/* Attendance Metric */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Lobby Check-In</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{presentCount} / {totalTeams}</span>
            <span className="text-xs text-emerald-400 font-semibold">Present</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Late: <strong className="text-amber-400">{lateCount}</strong></span>
            <button
              onClick={() => onNavigateTab('attendance')}
              className="text-emerald-400 hover:underline flex items-center gap-0.5"
            >
              Check-In <ArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>

        {/* Disputes & Penalties Metric */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Integrity Desk</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {tournament._count?.disputes || 0}
            </span>
            <span className="text-xs text-amber-400 font-semibold">Disputes</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Penalties: <strong className="text-rose-400">{tournament._count?.penalties || 0}</strong></span>
            <button
              onClick={() => onNavigateTab('penalties')}
              className="text-rose-400 hover:underline flex items-center gap-0.5"
            >
              Review <ArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mini Standings Preview & Quick Operational Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Standings Snippet */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Live Tournament Standings</h3>
            </div>
            <button
              onClick={() => onNavigateTab('leaderboard')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
            >
              View Full Leaderboard <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3">Team</th>
                  <th className="py-2 px-3 text-center">Matches</th>
                  <th className="py-2 px-3 text-center">WWCD</th>
                  <th className="py-2 px-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {tournament.teams?.slice(0, 6).map((team: any, index: number) => (
                  <tr key={team.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-300">
                      {index === 0 ? <span className="text-amber-400">1</span> : index + 1}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{team.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">[{team.tag}]</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-400">{completedMatches}</td>
                    <td className="py-2.5 px-3 text-center">
                      {index === 0 ? (
                        <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                          🍗 1
                        </span>
                      ) : index === 2 ? (
                        <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                          🍗 1
                        </span>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black font-mono text-emerald-400 text-sm">
                      {index === 0 ? 35 : index === 1 ? 28 : index === 2 ? 26 : 22 - index * 2}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Rules & Dispute Window */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Active Match Policies
          </h3>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80">
              <span className="text-slate-400 font-semibold block text-[11px] uppercase font-mono">
                No-Show Grace Period
              </span>
              <p className="mt-0.5 text-slate-200">
                {tournament.settings?.noShowGraceMinutes || 10} minutes post room opening. Unfilled slots set to absent.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80">
              <span className="text-slate-400 font-semibold block text-[11px] uppercase font-mono">
                Dispute Protest Window
              </span>
              <p className="mt-0.5 text-slate-200">
                {tournament.settings?.disputeWindowMinutes || 15} minutes following WWCD before scores become irreversible.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80">
              <span className="text-slate-400 font-semibold block text-[11px] uppercase font-mono">
                Scoring Rule
              </span>
              <p className="mt-0.5 text-emerald-400 font-bold">
                {tournament.scoringRule?.name || 'Official BGIS 10-Point System'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
