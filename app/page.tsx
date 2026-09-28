'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  PlusCircle,
  Radio,
  Play,
  ArrowRight,
  Shield,
  Users,
  Calendar,
  Calculator,
  Flame,
} from 'lucide-react';
import { OverviewDashboard } from '@/components/dashboard/OverviewDashboard';
import { TournamentSubNav, TournamentTab } from '@/components/shared/TournamentSubNav';
import { TeamManagementView } from '@/components/teams/TeamManagementView';
import { GroupManagementView } from '@/components/groups/GroupManagementView';
import { ScheduleView } from '@/components/schedule/ScheduleView';
import { RoomManagementView } from '@/components/rooms/RoomManagementView';
import { AttendanceView } from '@/components/attendance/AttendanceView';
import { MatchControlView } from '@/components/match/MatchControlView';
import { LeaderboardView } from '@/components/leaderboard/LeaderboardView';
import { PenaltyManagementView } from '@/components/penalties/PenaltyManagementView';
import { DisputeManagementView } from '@/components/disputes/DisputeManagementView';
import { ReportsView } from '@/components/reports/ReportsView';
import { SettingsView } from '@/components/settings/SettingsView';
import { FastScoreEntryGrid } from '@/components/match/FastScoreEntryGrid';

export default function RootHomePage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [activeTournament, setActiveTournament] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<TournamentTab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  const fetchTournaments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/tournaments');
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        setTournaments(data.data);
        // Load details of the first/most active tournament
        const detailRes = await fetch(`/api/tournaments/${data.data[0].id}`);
        const detailData = await detailRes.json();
        if (detailData.success) {
          setActiveTournament(detailData.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch('/api/demo/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchTournaments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSeeding(false);
    }
  };

  if (isLoading && !activeTournament) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#ffb60e] border-t-transparent rounded-full animate-spin mx-auto shadow-lg shadow-[#ffb60e]/20" />
          <p className="text-xs text-[#ffb60e] font-mono tracking-widest uppercase">
            INITIALIZING BGMI TOURNAMENT CONTROL CENTER...
          </p>
        </div>
      </div>
    );
  }

  // If no tournament exists, display onboarding welcome screen
  if (!activeTournament) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 space-y-12">
        <div className="text-center space-y-5">
          <div className="flex justify-center items-center">
            <div className="relative w-64 sm:w-80 h-20 sm:h-28 transition-transform hover:scale-105 duration-300">
              <Image
                src="/images/logos/BGMI_logo.svg"
                alt="Battlegrounds Mobile India"
                fill
                className="object-contain drop-shadow-[0_8px_24px_rgba(255,182,14,0.2)]"
                priority
              />
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 tactical-cut bg-[#ffb60e]/15 border border-[#ffb60e]/40 text-[#ffb60e] font-condensed font-black tracking-widest text-xs uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffb60e] animate-pulse" />
            <span>TOURNAMENT CONTROL CENTER // ESPORTS OPS</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-heading font-black text-white tracking-wider uppercase">
            Command Center Architecture
          </h1>
          <p className="text-slate-300 max-w-xl mx-auto text-sm leading-relaxed font-sans">
            The authoritative esports operations hub for Battlegrounds Mobile India organizers.
            Plan map rotations, manage squad check-in, dispatch room credentials, execute rapid score entry, and finalize leaderboards without spreadsheets.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={handleSeedDemo}
              disabled={isSeeding}
              className="tactical-btn-gold px-8 py-3.5 text-sm uppercase tracking-wider font-heading font-black shadow-xl shadow-[#ffb60e]/20 transition-all flex items-center gap-2"
            >
              <Radio className={`w-4 h-4 ${isSeeding ? 'animate-pulse' : ''}`} />
              <span>{isSeeding ? 'SEEDING TOURNAMENT...' : 'LOAD OFFICIAL DEMO TOURNAMENT'}</span>
            </button>

            <Link
              href="/tournaments/new"
              className="tactical-cut bg-[#151515] hover:bg-[#202020] text-slate-200 border border-white/10 hover:border-[#ffb60e]/50 px-8 py-3.5 text-sm uppercase tracking-wider font-heading font-black transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-[#ffb60e]" />
              <span>CREATE TOURNAMENT WIZARD</span>
            </Link>
          </div>
        </div>

        {/* Features Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="tactical-cut bg-[#121212] border border-white/10 p-6 space-y-3 hover:border-[#ffb60e]/40 transition-all">
            <div className="w-10 h-10 tactical-cut bg-[#ffb60e]/10 border border-[#ffb60e]/30 flex items-center justify-center text-[#ffb60e]">
              <Calculator className="w-5 h-5" />
            </div>
            <h3 className="text-base font-heading font-bold text-white tracking-wide uppercase">Configurable Scoring Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Official BGIS 10-Point, BMPS 15-Point, or custom rules. Automatic tie-breaker trees (WWCD, Placement, Kills, Best Match).
            </p>
          </div>

          <div className="tactical-cut bg-[#121212] border border-white/10 p-6 space-y-3 hover:border-[#ffb60e]/40 transition-all">
            <div className="w-10 h-10 tactical-cut bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Play className="w-5 h-5" />
            </div>
            <h3 className="text-base font-heading font-bold text-white tracking-wide uppercase">Rapid Match Day Ops</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              1-click attendance check-in, instant Room ID/Password copy, lobby conflict detection, and 60-second score entry.
            </p>
          </div>

          <div className="tactical-cut bg-[#121212] border border-white/10 p-6 space-y-3 hover:border-[#ffb60e]/40 transition-all">
            <div className="w-10 h-10 tactical-cut bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-heading font-bold text-white tracking-wide uppercase">Integrity & Audit</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Immutable audit logs, point penalties, dispute adjudication desk, and pre-flight finalization checklist guards.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const liveMatch = activeTournament.matches?.find((m: any) => m.status === 'LIVE');
  const targetMatchId = liveMatch?.id || activeTournament.matches?.[0]?.id;

  // Active Tournament Dashboard View
  return (
    <div className="min-h-[calc(100vh-60px)] flex flex-col">
      {/* Sub Navigation */}
      <TournamentSubNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={{
          teams: activeTournament._count?.teams,
          matches: activeTournament._count?.matches,
          disputes: activeTournament._count?.disputes,
          penalties: activeTournament._count?.penalties,
        }}
      />

      {/* Main Tab View */}
      <div className="flex-1 px-4 lg:px-8 py-6 max-w-7xl mx-auto w-full">
        {activeTab === 'overview' && (
          <OverviewDashboard
            tournament={activeTournament}
            onNavigateTab={setActiveTab}
            onRefresh={fetchTournaments}
          />
        )}

        {activeTab === 'teams' && <TeamManagementView tournamentId={activeTournament.id} />}

        {activeTab === 'groups' && <GroupManagementView tournamentId={activeTournament.id} />}

        {activeTab === 'schedule' && (
          <ScheduleView tournamentId={activeTournament.id} onNavigateTab={setActiveTab} />
        )}

        {activeTab === 'rooms' && <RoomManagementView tournamentId={activeTournament.id} />}

        {activeTab === 'attendance' && <AttendanceView tournamentId={activeTournament.id} />}

        {activeTab === 'matches' && <MatchControlView tournamentId={activeTournament.id} />}

        {activeTab === 'scoring' && targetMatchId && (
          <FastScoreEntryGrid
            tournamentId={activeTournament.id}
            matchId={targetMatchId}
            onScoresSaved={fetchTournaments}
          />
        )}

        {activeTab === 'leaderboard' && <LeaderboardView tournamentId={activeTournament.id} />}

        {activeTab === 'penalties' && <PenaltyManagementView tournamentId={activeTournament.id} />}

        {activeTab === 'disputes' && <DisputeManagementView tournamentId={activeTournament.id} />}

        {activeTab === 'reports' && <ReportsView tournamentId={activeTournament.id} />}

        {activeTab === 'settings' && (
          <SettingsView
            tournamentId={activeTournament.id}
            onTournamentFinalized={fetchTournaments}
          />
        )}
      </div>
    </div>
  );
}
