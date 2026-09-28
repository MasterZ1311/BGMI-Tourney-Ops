'use client';

import React from 'react';
import {
  LayoutDashboard,
  Users,
  Grid,
  Calendar,
  DoorOpen,
  UserCheck,
  Crosshair,
  Calculator,
  Trophy,
  AlertOctagon,
  Scale,
  FileText,
  Settings,
} from 'lucide-react';

export type TournamentTab =
  | 'overview'
  | 'teams'
  | 'groups'
  | 'schedule'
  | 'rooms'
  | 'attendance'
  | 'matches'
  | 'scoring'
  | 'leaderboard'
  | 'penalties'
  | 'disputes'
  | 'reports'
  | 'settings';

interface SubNavProps {
  activeTab: TournamentTab;
  onTabChange: (tab: TournamentTab) => void;
  counts?: {
    teams?: number;
    matches?: number;
    disputes?: number;
    penalties?: number;
  };
}

export function TournamentSubNav({ activeTab, onTabChange, counts }: SubNavProps) {
  const tabs: Array<{ id: TournamentTab; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'teams', label: 'Teams', icon: <Users className="w-4 h-4" />, badge: counts?.teams },
    { id: 'groups', label: 'Groups', icon: <Grid className="w-4 h-4" /> },
    { id: 'schedule', label: 'Schedule', icon: <Calendar className="w-4 h-4" /> },
    { id: 'rooms', label: 'Rooms', icon: <DoorOpen className="w-4 h-4" /> },
    { id: 'attendance', label: 'Attendance', icon: <UserCheck className="w-4 h-4" /> },
    { id: 'matches', label: 'Matches', icon: <Crosshair className="w-4 h-4" />, badge: counts?.matches },
    { id: 'scoring', label: 'Score Entry', icon: <Calculator className="w-4 h-4" /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="w-4 h-4 text-amber-400" /> },
    { id: 'penalties', label: 'Penalties', icon: <AlertOctagon className="w-4 h-4 text-rose-400" />, badge: counts?.penalties },
    { id: 'disputes', label: 'Disputes', icon: <Scale className="w-4 h-4 text-amber-300" />, badge: counts?.disputes },
    { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="border-b border-[#2e2e2e] bg-[#121212] px-4 lg:px-8 overflow-x-auto scrollbar-none">
      <nav className="flex space-x-1.5 min-w-max py-2" aria-label="Tournament navigation">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-condensed uppercase tracking-wider font-bold transition-all tactical-cut ${
                isActive
                  ? 'bg-[#ffb60e] text-black shadow-md shadow-[#ffb60e]/20 font-black'
                  : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a] border border-transparent'
              }`}
            >
              <span className={isActive ? 'text-black' : 'text-[#ffb60e]'}>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 font-condensed font-black ${
                    isActive
                      ? 'bg-black text-[#ffb60e]'
                      : 'bg-[#222222] text-[#ffb60e] border border-[#ffb60e]/40'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
