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
    <div className="border-b border-slate-800 bg-[#0a0f19] px-4 lg:px-8 overflow-x-auto scrollbar-none">
      <nav className="flex space-x-1 min-w-max py-1.5" aria-label="Tournament navigation">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300'
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
