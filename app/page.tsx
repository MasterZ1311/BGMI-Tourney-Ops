'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
          <div className="w-9 h-9 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-mono tracking-wider">
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
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white mx-auto shadow-2xl shadow-emerald-500/30">
            <Trophy className="w-9 h-9" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            BGMI Tournament Control Center
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
            The all-in-one operations hub for Battlegrounds Mobile India esports organizers.
            Plan schedules, manage squad check-in, dispatch room credentials, enter scores, and finalize leaderboards without spreadsheets.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              onClick={handleSeedDemo}
              disabled={isSeeding}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all"
            >
              <Radio className={`w-4 h-4 ${isSeeding ? 'animate-pulse' : ''}`} />
              <span>{isSeeding ? 'Seeding Tournament...' : 'Load Demo Tournament'}</span>
            </button>

            <Link
              href="/tournaments/new"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-sm font-bold transition-all"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Create Tournament Wizard</span>
            </Link>
          </div>
        </div>

        {/* Features Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Calculator className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Configurable Scoring Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Official BGIS 10-Point, BMPS 15-Point, or custom rules. Automatic tie-breaker trees (WWCD, Placement, Kills, Best Match).
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Play className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Rapid Match Day Ops</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              1-click attendance check-in, instant Room ID/Password copy, lobby conflict detection, and 60-second score entry.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Integrity & Audit</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
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
