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
    const battlegroundMaps = [
      { name: 'ERANGEL', size: '8x8 KM', type: 'CLASSIC BATTLE ROYALE', img: '/images/maps/erangel.jpg' },
      { name: 'MIRAMAR', size: '8x8 KM', type: 'DESERT WARFARE', img: '/images/maps/miramar.jpg' },
      { name: 'SANHOK', size: '4x4 KM', type: 'JUNGLE ASSAULT', img: '/images/maps/sanhok.jpg' },
      { name: 'VIKENDI', size: '6x6 KM', type: 'GLACIAL COMBAT', img: '/images/maps/vikendi.jpg' },
      { name: 'RONDO', size: '8x8 KM', type: 'ORIENTAL TACTICAL', img: '/images/maps/rondo.jpg' },
    ];

    return (
      <div className="relative min-h-[calc(100vh-60px)] bgmi-grid-pattern bgmi-radial-vignette py-12 px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Hero Banner Section */}
        <div className="max-w-4xl mx-auto text-center space-y-5">
          <div className="flex justify-center items-center">
            <div className="relative w-72 sm:w-96 h-24 sm:h-32 transition-transform hover:scale-105 duration-300">
              <Image
                src="/images/logos/BGMI_logo.svg"
                alt="Battlegrounds Mobile India"
                fill
                className="object-contain drop-shadow-[0_10px_30px_rgba(255,182,14,0.3)]"
                priority
              />
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 tactical-cut bg-[#ffb60e]/15 border border-[#ffb60e]/40 text-[#ffb60e] font-condensed font-black tracking-widest text-xs uppercase shadow-md shadow-[#ffb60e]/10">
            <span className="w-2 h-2 rounded-full bg-[#ffb60e] animate-pulse" />
            <span>OFFICIAL ESPORTS TOURNAMENT CONTROL SYSTEM // BGIS & BMPS COMPLIANT</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-heading font-black text-white tracking-wider uppercase leading-none">
            TOURNAMENT COMMAND CENTER
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm leading-relaxed font-sans">
            The authoritative operations hub for Battlegrounds Mobile India organizers.
            Automate map rotations, manage squad check-in, dispatch secure room credentials, execute rapid 60-second score entries, and finalize official leaderboards without spreadsheets.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
            <Link
              href="/tournaments/new"
              className="tactical-btn-gold px-8 py-3.5 text-sm shadow-xl shadow-[#ffb60e]/25 transition-all flex items-center gap-2 group"
            >
              <PlusCircle className="w-5 h-5 text-black group-hover:rotate-90 transition-transform duration-200 stroke-[2.5]" />
              <span>CREATE FIRST TOURNAMENT</span>
            </Link>

            <button
              onClick={handleSeedDemo}
              disabled={isSeeding}
              className="tactical-btn-dark px-7 py-3.5 text-sm uppercase tracking-wider font-heading font-black flex items-center gap-2"
            >
              <Radio className={`w-4 h-4 text-[#ffb60e] ${isSeeding ? 'animate-pulse' : ''}`} />
              <span>{isSeeding ? 'SEEDING TOURNAMENT...' : 'LOAD SAMPLE TOURNAMENT TEMPLATE'}</span>
            </button>
          </div>
        </div>

        {/* Official Battlegrounds Map Pool Gallery */}
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="flex items-center justify-between border-b border-[#333333] pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#ffb60e]"></span>
              <h2 className="text-xl font-heading font-bold text-white tracking-wider uppercase">
                COMPETITION BATTLEGROUND POOL (5 OFFICIAL MAPS)
              </h2>
            </div>
            <span className="text-[11px] font-condensed font-bold uppercase tracking-widest text-[#ffb60e]">
              READY FOR MAP ROTATION
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {battlegroundMaps.map((map) => (
              <div
                key={map.name}
                className="group relative h-40 tactical-cut overflow-hidden border border-[#333333] hover:border-[#ffb60e] transition-all duration-300 shadow-xl"
              >
                <img
                  src={map.img}
                  alt={map.name}
                  className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute top-2.5 right-2.5 px-1.5 py-0.5 tactical-cut bg-black/80 border border-white/20 text-[10px] font-condensed font-black tracking-wider text-white">
                  {map.size}
                </div>
                <div className="absolute bottom-2.5 left-2.5 right-2.5">
                  <p className="text-[10px] font-condensed font-bold tracking-widest text-[#ffb60e] uppercase">
                    {map.type}
                  </p>
                  <h3 className="text-2xl font-heading font-bold text-white tracking-wider leading-none">
                    {map.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Matrix with Tactical HUD Frames */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="hud-frame bg-[#141414] border border-[#2e2e2e] p-6 space-y-3 hover:border-[#ffb60e]/50 transition-all shadow-xl">
            <div className="w-12 h-12 tactical-cut bg-[#ffb60e]/10 border border-[#ffb60e]/30 flex items-center justify-center text-[#ffb60e]">
              <Calculator className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-condensed font-black tracking-widest text-[#ffb60e]">01 // ENGINE</span>
            </div>
            <h3 className="text-xl font-heading font-bold text-white tracking-wide uppercase leading-tight">
              Configurable Scoring Engine
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Official BGIS 10-Point, BMPS 15-Point, or custom rulesets. Multi-tier deterministic tie-breakers (WWCD, Placement Points, Kill Counts, Best Match).
            </p>
          </div>

          <div className="hud-frame bg-[#141414] border border-[#2e2e2e] p-6 space-y-3 hover:border-cyan-500/50 transition-all shadow-xl">
            <div className="w-12 h-12 tactical-cut bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Play className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-condensed font-black tracking-widest text-cyan-400">02 // MATCH DAY</span>
            </div>
            <h3 className="text-xl font-heading font-bold text-white tracking-wide uppercase leading-tight">
              Rapid Match Day Operations
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              1-click squad attendance check-in, formatted Room ID/Password copy, real-time schedule conflict prevention, and 60-second score entry grid.
            </p>
          </div>

          <div className="hud-frame bg-[#141414] border border-[#2e2e2e] p-6 space-y-3 hover:border-amber-500/50 transition-all shadow-xl">
            <div className="w-12 h-12 tactical-cut bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Shield className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-condensed font-black tracking-widest text-amber-400">03 // INTEGRITY</span>
            </div>
            <h3 className="text-xl font-heading font-bold text-white tracking-wide uppercase leading-tight">
              Integrity & Pre-Flight Audit
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Full immutable audit trail, point penalties, dedicated dispute resolution desk, and pre-flight finalization checklist guarding standings.
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
