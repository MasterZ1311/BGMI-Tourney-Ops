'use client';

import React, { useState, useEffect } from 'react';
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
  Eye,
  EyeOff,
  Share2,
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
  const [copiedFormatted, setCopiedFormatted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [standings, setStandings] = useState<any[]>([]);

  useEffect(() => {
    if (!tournament?.id) return;
    fetch(`/api/tournaments/${tournament.id}/leaderboard`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data?.standings) {
          setStandings(res.data.standings);
        }
      })
      .catch((err) => console.error('Failed to fetch overview leaderboard:', err));
  }, [tournament?.id]);

  if (!tournament) {
    return (
      <div className="bg-[#171716] border border-[#333333] tactical-cut p-8 text-center text-gray-400">
        <AlertTriangle className="w-8 h-8 text-[#ffb60e] mx-auto mb-2" />
        <p className="font-teko uppercase text-xl font-bold text-white">Tournament data unavailable</p>
        <button
          onClick={onRefresh}
          className="mt-3 px-4 py-1.5 text-xs font-teko uppercase font-bold text-black tactical-btn-gold text-sm shadow-md"
        >
          Refresh
        </button>
      </div>
    );
  }

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

  const copyFormattedCredentials = () => {
    if (!currentMatch?.room) return;
    const roomId = currentMatch.room.roomId || 'TBD';
    const password = currentMatch.room.password || 'TBD';
    const text = `🎮 [BGMI LOBBY CREDENTIALS]\n🏆 ${tournament.name}\n⚔️ Match #${currentMatch.matchNumber} (${currentMatch.map || 'ERANGEL'})\n🆔 Room ID: ${roomId}\n🔑 Password: ${password}\n⏰ Status: ${currentMatch.status}. Join designated squad slot immediately!`;
    navigator.clipboard.writeText(text);
    setCopiedFormatted(true);
    setTimeout(() => setCopiedFormatted(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Operations Command Bar */}
      <div className="bg-[#171716] border border-[#333333] p-5 shadow-2xl relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 tactical-cut text-xs font-condensed font-bold uppercase tracking-wider ${
                tournament.status === 'LIVE'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                  : 'bg-[#ffb60e]/15 text-[#ffb60e] border border-[#ffb60e]/40'
              }`}>
                <span className={`w-2 h-2 rounded-full ${tournament.status === 'LIVE' ? 'bg-rose-400' : 'bg-[#ffb60e]'}`}></span>
                {tournament.status}
              </span>
              <span className="text-xs text-gray-400 font-condensed font-bold uppercase tracking-wider">
                {tournament.format.replace(/_/g, ' ')}
              </span>
            </div>
            <h1 className="text-3xl font-teko uppercase font-bold tracking-wider text-white leading-none">
              {tournament.name}
            </h1>
            <p className="text-xs font-condensed uppercase tracking-wider text-gray-400 mt-1">
              ORGANIZED BY <strong className="text-white">{tournament.organizer}</strong> • VENUE: <span className="text-[#ffb60e]">{tournament.venue || 'ONLINE CUSTOM LOBBY'}</span>
            </p>
          </div>

          {/* Rapid Action Buttons Strip */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigateTab('matches')}
              className="tactical-btn-gold text-xs font-teko font-bold text-black uppercase tracking-wider px-3.5 py-1.5 flex items-center gap-1.5 text-base shadow-md shadow-[#ffb60e]/20"
            >
              <Play className="w-3.5 h-3.5 fill-current text-black" />
              <span>MATCH CONTROL</span>
            </button>

            <button
              onClick={() => onNavigateTab('rooms')}
              className="flex items-center gap-2 px-3.5 py-1.5 tactical-cut bg-[#222222] hover:bg-[#2a2a2a] text-[#ffb60e] border border-[#444444] text-xs font-teko uppercase tracking-wider font-bold text-base transition-colors"
            >
              <DoorOpen className="w-3.5 h-3.5 text-[#ffb60e]" />
              <span>ROOM OPS</span>
            </button>

            <button
              onClick={() => onNavigateTab('scoring')}
              className="flex items-center gap-2 px-3.5 py-1.5 tactical-cut bg-[#222222] hover:bg-[#2a2a2a] text-gray-200 border border-[#444444] text-xs font-teko uppercase tracking-wider font-bold text-base transition-colors"
            >
              <Calculator className="w-3.5 h-3.5 text-[#ffb60e]" />
              <span>SCORE ENTRY</span>
            </button>

            <button
              onClick={() => onNavigateTab('attendance')}
              className="flex items-center gap-2 px-3.5 py-1.5 tactical-cut bg-[#222222] hover:bg-[#2a2a2a] text-gray-200 border border-[#444444] text-xs font-teko uppercase tracking-wider font-bold text-base transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-gray-400" />
              <span>ATTENDANCE</span>
            </button>

            <button
              onClick={() => onNavigateTab('leaderboard')}
              className="flex items-center gap-2 px-3.5 py-1.5 tactical-cut bg-[#222222] hover:bg-[#2a2a2a] text-[#ffb60e] border border-[#ffb60e]/40 text-xs font-teko uppercase tracking-wider font-bold text-base transition-colors"
            >
              <Trophy className="w-3.5 h-3.5 text-[#ffb60e]" />
              <span>LEADERBOARD</span>
            </button>
          </div>
        </div>
      </div>

      {/* Current Match Ticker & Room Card */}
      {currentMatch && (
        <div className={`bg-[#171716] border border-[#333333] p-5 relative overflow-hidden tactical-cut ${
          currentMatch.status === 'LIVE' ? 'border-l-4 border-l-[#ffb60e] shadow-xl shadow-[#ffb60e]/10' : ''
        }`}>
          {/* Dynamic Map Background Artwork */}
          <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
            <img
              src={`/images/maps/${(currentMatch.map || 'erangel').toLowerCase()}.jpg`}
              alt=""
              className="w-full h-full object-cover object-center"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#171716] via-[#171716]/85 to-transparent" />
          </div>

          {currentMatch.status === 'LIVE' && (
            <div className="tactical-hazard-bar absolute top-0 left-0 h-1.5 w-full"></div>
          )}

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-[#101010] border border-[#333333] flex flex-col items-center justify-center text-center tactical-cut">
                <span className="text-[10px] uppercase font-condensed font-bold text-gray-500">MATCH</span>
                <span className="text-2xl font-teko font-bold text-[#ffb60e] leading-none">#{currentMatch.matchNumber}</span>
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-xl font-teko uppercase font-bold tracking-wider text-white">{currentMatch.title}</h3>
                  <span className={`text-[10px] font-condensed font-black uppercase px-2 py-0.5 tactical-cut ${
                    currentMatch.status === 'LIVE'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                      : 'bg-[#ffb60e]/15 text-[#ffb60e] border border-[#ffb60e]/40'
                  }`}>
                    {currentMatch.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400 mt-1 font-condensed font-bold uppercase tracking-wide">
                  <span>MAP: <strong className="text-white">{currentMatch.map}</strong></span>
                  <span>MODE: <strong className="text-white">{currentMatch.perspective}</strong></span>
                  <span>RESULTS: <strong className="text-[#ffb60e]">{currentMatch.resultStatus}</strong></span>
                </div>
              </div>
            </div>

            {/* Room Credentials Strip */}
            {currentMatch.room && (
              <div className="flex items-center gap-3 bg-[#101010] border border-[#333333] p-3 tactical-cut">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-condensed font-bold">ROOM ID</p>
                  <div className="flex items-center gap-1.5">
                    <span className="font-condensed font-black text-sm text-white tracking-wider">
                      {currentMatch.room.roomId || 'PENDING'}
                    </span>
                    {currentMatch.room.roomId && (
                      <button
                        onClick={() => copyToClipboard(currentMatch.room.roomId, 'id')}
                        className="text-gray-400 hover:text-white p-1 hover:bg-[#222222]"
                        title="Copy Room ID"
                      >
                        {copiedId ? <Check className="w-3.5 h-3.5 text-[#ffb60e]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="h-8 w-px bg-[#2e2e2e]"></div>

                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-condensed font-bold">PASSWORD</p>
                  <div className="flex items-center gap-1.5">
                    <span className="font-condensed font-black text-sm text-[#ffb60e] tracking-wider">
                      {currentMatch.room.password
                        ? showPassword
                          ? currentMatch.room.password
                          : '••••••••'
                        : 'PENDING'}
                    </span>
                    {currentMatch.room.password && (
                      <>
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-gray-400 hover:text-white p-1 hover:bg-[#222222] transition-colors"
                          title={showPassword ? 'Hide Password' : 'Show Password'}
                          aria-label={showPassword ? 'Hide Password' : 'Show Password'}
                        >
                          {showPassword ? (
                            <EyeOff className="w-3.5 h-3.5 text-[#ffb60e]" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => copyToClipboard(currentMatch.room.password, 'pass')}
                          className="text-gray-400 hover:text-white p-1 hover:bg-[#222222] transition-colors"
                          title="Copy Password"
                          aria-label="Copy Password"
                        >
                          {copiedPass ? <Check className="w-3.5 h-3.5 text-[#ffb60e]" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="h-8 w-px bg-[#2e2e2e]"></div>

                {/* 1-Click Formatted Copy for Discord / WhatsApp */}
                <button
                  onClick={copyFormattedCredentials}
                  className="flex items-center gap-1.5 text-xs bg-[#222222] hover:bg-[#2a2a2a] text-gray-200 border border-[#444444] px-3 py-1.5 tactical-cut font-condensed font-bold uppercase tracking-wider transition-all"
                  title="Copy formatted room message for Discord/WhatsApp"
                >
                  {copiedFormatted ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#ffb60e]" />
                      <span className="text-[#ffb60e] font-condensed text-[11px]">COPIED!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-[#ffb60e]" />
                      <span className="text-[11px] font-condensed">FORMAT COPY</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => onNavigateTab('matches')}
                  className="tactical-btn-gold text-xs font-teko font-bold text-black uppercase tracking-wider px-3.5 py-1.5 text-sm"
                >
                  ENTER ROOM
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fallback if no match scheduled */}
      {!currentMatch && (
        <div className="bg-[#171716] border border-dashed border-[#333333] tactical-cut p-6 text-center">
          <Clock className="w-8 h-8 text-[#ffb60e] mx-auto mb-2" />
          <h4 className="text-lg font-teko uppercase font-bold text-gray-200">No Active or Scheduled Match</h4>
          <p className="text-xs font-condensed uppercase tracking-wider text-gray-400 mt-1">
            Generate tournament match fixtures to begin room operations and scorekeeping.
          </p>
          <button
            onClick={() => onNavigateTab('schedule')}
            className="mt-3 px-4 py-1.5 text-xs font-teko uppercase font-bold text-black tactical-btn-gold text-sm shadow-md"
          >
            Go to Schedule
          </button>
        </div>
      )}

      {/* 4 Operations Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Teams Metric */}
        <div className="bg-[#171716] border border-[#333333] p-4 tactical-cut relative">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-condensed font-bold uppercase tracking-wider">SQUADS</span>
            <UserCheck className="w-4 h-4 text-[#ffb60e]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-teko font-bold text-white">{totalTeams}</span>
            <span className="text-xs text-[#ffb60e] font-condensed font-bold uppercase">{verifiedTeams} VERIFIED</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-condensed text-gray-400 pt-2 border-t border-[#2e2e2e]">
            <span>CHECKED IN: <strong className="text-white">{presentCount}</strong></span>
            <span>ABSENT: <strong className="text-rose-400">{absentCount}</strong></span>
          </div>
        </div>

        {/* Matches Metric */}
        <div className="bg-[#171716] border border-[#333333] p-4 tactical-cut relative">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-condensed font-bold uppercase tracking-wider">MATCHES</span>
            <Flame className="w-4 h-4 text-[#ffb60e]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-teko font-bold text-white">{completedMatches} / {totalMatches}</span>
            <span className="text-xs text-gray-400 font-condensed uppercase font-bold">DONE</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-condensed text-gray-400 pt-2 border-t border-[#2e2e2e]">
            <span>REMAINING: <strong className="text-white">{remainingMatches}</strong></span>
            <span className="text-[#ffb60e] font-bold">
              {totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0}% COMPLETE
            </span>
          </div>
        </div>

        {/* Attendance Metric */}
        <div className="bg-[#171716] border border-[#333333] p-4 tactical-cut relative">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-condensed font-bold uppercase tracking-wider">LOBBY CHECK-IN</span>
            <Clock className="w-4 h-4 text-[#ffb60e]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-teko font-bold text-white">{presentCount} / {totalTeams}</span>
            <span className="text-xs text-[#ffb60e] font-condensed font-bold uppercase">
              {totalTeams > 0 ? Math.round((presentCount / totalTeams) * 100) : 0}% RATE
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-condensed text-gray-400 pt-2 border-t border-[#2e2e2e]">
            <span>LATE: <strong className="text-amber-400">{lateCount}</strong></span>
            <button
              onClick={() => onNavigateTab('attendance')}
              className="text-[#ffb60e] hover:underline flex items-center gap-0.5 font-bold uppercase"
            >
              CHECK-IN <ArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>

        {/* Disputes & Penalties Metric */}
        <div className="bg-[#171716] border border-[#333333] p-4 tactical-cut relative">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-condensed font-bold uppercase tracking-wider">INTEGRITY DESK</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-teko font-bold text-white">
              {tournament._count?.disputes || 0}
            </span>
            <span className="text-xs text-rose-400 font-condensed font-bold uppercase">DISPUTES</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-condensed text-gray-400 pt-2 border-t border-[#2e2e2e]">
            <span>PENALTIES: <strong className="text-rose-400">{tournament._count?.penalties || 0}</strong></span>
            <button
              onClick={() => onNavigateTab('penalties')}
              className="text-rose-400 hover:underline flex items-center gap-0.5 font-bold uppercase"
            >
              REVIEW <ArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mini Standings Preview & Quick Operational Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Standings Snippet */}
        <div className="lg:col-span-2 bg-[#171716] border border-[#333333] p-5 tactical-cut">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#ffb60e]" />
              <h3 className="text-xl font-teko uppercase font-bold tracking-wider text-white">LIVE TOURNAMENT STANDINGS</h3>
            </div>
            <button
              onClick={() => onNavigateTab('leaderboard')}
              className="text-xs font-condensed uppercase font-bold text-[#ffb60e] hover:text-white transition-colors flex items-center gap-1"
            >
              VIEW FULL LEADERBOARD <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#2e2e2e] text-gray-400 font-condensed uppercase font-bold text-xs">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">TEAM / SQUAD</th>
                  <th className="py-2.5 px-3 text-center">MATCHES</th>
                  <th className="py-2.5 px-3 text-center">WWCD</th>
                  <th className="py-2.5 px-3 text-right">TOTAL POINTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626] font-medium font-condensed">
                {standings.length > 0 ? (
                  standings.slice(0, 6).map((standing: any, index: number) => (
                    <tr key={standing.teamId || index} className={`hover:bg-[#202020] transition-colors ${
                      index === 0 ? 'bg-[#ffb60e]/5 border-l-2 border-l-[#ffb60e]' : ''
                    }`}>
                      <td className="py-2.5 px-3 font-teko text-base font-bold text-gray-300">
                        {index === 0 ? <span className="text-[#ffb60e]">#1</span> : `#${standing.rank || index + 1}`}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{standing.teamName}</span>
                          <span className="text-[10px] text-gray-500 font-condensed font-bold">[{standing.teamTag}]</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center text-gray-400 font-bold">{standing.matchesPlayed ?? completedMatches}</td>
                      <td className="py-2.5 px-3 text-center">
                        {standing.wwcdCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[#ffb60e] font-bold">
                            🍗 {standing.wwcdCount}
                          </span>
                        ) : (
                          <span className="text-gray-500">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-[#ffb60e] text-base">
                        {standing.totalPoints ?? 0}
                      </td>
                    </tr>
                  ))
                ) : (!tournament.teams || tournament.teams.length === 0) ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <Trophy className="w-8 h-8 text-gray-600 mb-1" />
                        <span className="font-teko uppercase text-base text-gray-400">NO SQUADS REGISTERED YET</span>
                        <span className="text-xs text-gray-500">Register squads or import teams to see standings preview.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  tournament.teams.slice(0, 6).map((team: any, index: number) => (
                    <tr key={team.id || index} className={`hover:bg-[#202020] transition-colors ${
                      index === 0 ? 'bg-[#ffb60e]/5 border-l-2 border-l-[#ffb60e]' : ''
                    }`}>
                      <td className="py-2.5 px-3 font-teko text-base font-bold text-gray-300">
                        #{index + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{team.name}</span>
                          <span className="text-[10px] text-gray-500 font-condensed font-bold">[{team.tag}]</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center text-gray-400 font-bold">{completedMatches}</td>
                      <td className="py-2.5 px-3 text-center text-gray-500">0</td>
                      <td className="py-2.5 px-3 text-right font-black text-[#ffb60e] text-base">0</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Rules & Dispute Window */}
        <div className="bg-[#171716] border border-[#333333] p-5 tactical-cut space-y-4">
          <h3 className="text-xl font-teko uppercase font-bold tracking-wider text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#ffb60e]" />
            ACTIVE MATCH POLICIES
          </h3>

          <div className="space-y-3 text-xs text-gray-300 font-condensed font-medium">
            <div className="p-3 bg-[#101010] border border-[#333333] tactical-cut">
              <span className="text-[#ffb60e] font-bold block text-[11px] uppercase tracking-wider">
                NO-SHOW GRACE PERIOD
              </span>
              <p className="mt-0.5 text-gray-300">
                {tournament.settings?.noShowGraceMinutes || 10} minutes post room opening. Unfilled slots set to absent.
              </p>
            </div>

            <div className="p-3 bg-[#101010] border border-[#333333] tactical-cut">
              <span className="text-[#ffb60e] font-bold block text-[11px] uppercase tracking-wider">
                DISPUTE PROTEST WINDOW
              </span>
              <p className="mt-0.5 text-gray-300">
                {tournament.settings?.disputeWindowMinutes || 15} minutes following WWCD before scores become irreversible.
              </p>
            </div>

            <div className="p-3 bg-[#101010] border border-[#333333] tactical-cut">
              <span className="text-[#ffb60e] font-bold block text-[11px] uppercase tracking-wider">
                SCORING RULE
              </span>
              <p className="mt-0.5 text-white font-bold text-sm">
                {tournament.scoringRule?.name || 'Official BGIS 10-Point System'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
