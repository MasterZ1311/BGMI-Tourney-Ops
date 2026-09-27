'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TournamentSubNav, TournamentTab } from '@/components/shared/TournamentSubNav';
import { OverviewDashboard } from '@/components/dashboard/OverviewDashboard';
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

export default function TournamentWorkspacePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TournamentTab) || 'overview';

  const [activeTab, setActiveTab] = useState<TournamentTab>(initialTab);
  const [tournament, setTournament] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTournament = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${params.id}`);
      const data = await res.json();
      if (data.success) {
        setTournament(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTournament();
  }, [params.id]);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as TournamentTab;
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (tab: TournamentTab) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    router.replace(url.pathname + url.search);
  };

  if (isLoading && !tournament) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#ffb60e] border-t-transparent rounded-full animate-spin mx-auto shadow-lg shadow-[#ffb60e]/20" />
          <p className="text-xs text-[#ffb60e] font-mono tracking-widest uppercase">LOADING BGMI TOURNAMENT DATA...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <p className="text-lg font-heading font-black tracking-wider text-slate-200 uppercase">Tournament Not Found</p>
        <button
          onClick={() => router.push('/')}
          className="tactical-btn-gold px-6 py-2.5 text-xs uppercase tracking-wider font-heading font-black"
        >
          Return to Control Center
        </button>
      </div>
    );
  }

  const liveMatch = tournament.matches?.find((m: any) => m.status === 'LIVE');
  const targetMatchId = liveMatch?.id || tournament.matches?.[0]?.id;

  return (
    <div className="min-h-[calc(100vh-60px)] flex flex-col">
      {/* Sub Navigation */}
      <TournamentSubNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        counts={{
          teams: tournament._count?.teams,
          matches: tournament._count?.matches,
          disputes: tournament._count?.disputes,
          penalties: tournament._count?.penalties,
        }}
      />

      {/* Main Content View per Tab */}
      <div className="flex-1 px-4 lg:px-8 py-6 max-w-7xl mx-auto w-full">
        {activeTab === 'overview' && (
          <OverviewDashboard
            tournament={tournament}
            onNavigateTab={handleTabChange}
            onRefresh={fetchTournament}
          />
        )}

        {activeTab === 'teams' && <TeamManagementView tournamentId={params.id} />}

        {activeTab === 'groups' && <GroupManagementView tournamentId={params.id} />}

        {activeTab === 'schedule' && (
          <ScheduleView tournamentId={params.id} onNavigateTab={handleTabChange} />
        )}

        {activeTab === 'rooms' && <RoomManagementView tournamentId={params.id} />}

        {activeTab === 'attendance' && <AttendanceView tournamentId={params.id} />}

        {activeTab === 'matches' && <MatchControlView tournamentId={params.id} />}

        {activeTab === 'scoring' && targetMatchId && (
          <FastScoreEntryGrid
            tournamentId={params.id}
            matchId={targetMatchId}
            onScoresSaved={fetchTournament}
          />
        )}

        {activeTab === 'leaderboard' && <LeaderboardView tournamentId={params.id} />}

        {activeTab === 'penalties' && <PenaltyManagementView tournamentId={params.id} />}

        {activeTab === 'disputes' && <DisputeManagementView tournamentId={params.id} />}

        {activeTab === 'reports' && <ReportsView tournamentId={params.id} />}

        {activeTab === 'settings' && (
          <SettingsView
            tournamentId={params.id}
            onTournamentFinalized={fetchTournament}
          />
        )}
      </div>
    </div>
  );
}
