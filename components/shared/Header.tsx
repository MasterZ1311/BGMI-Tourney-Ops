'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Trophy,
  PlusCircle,
  RefreshCw,
  Search,
  HelpCircle,
  Shield,
  Radio,
  Tv,
  ExternalLink,
} from 'lucide-react';

interface TournamentOption {
  id: string;
  name: string;
  status: string;
}

export function Header({
  activeTournamentId,
  onOpenShortcuts,
  onOpenSearch,
}: {
  activeTournamentId?: string;
  onOpenShortcuts?: () => void;
  onOpenSearch?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [tournaments, setTournaments] = useState<TournamentOption[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    fetch('/api/tournaments')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setTournaments(res.data);
        }
      })
      .catch((err) => console.error('Failed to load tournaments list', err));
  }, [pathname]);

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch('/api/demo/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        window.location.href = `/tournaments/${data.data.tournamentId}`;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleResetDemo = async () => {
    if (!confirm('Are you sure you want to reset demo tournament data? All scores and matches will be reset to initial state.')) {
      return;
    }
    setIsResetting(true);
    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <header className="border-b border-slate-800 bg-[#0c121e]/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-2.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Brand & Selector */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-wider text-base text-white">BGMI TCC</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Control Center
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono tracking-tight hidden sm:block">
                PLAN • RUN • SCORE • FINALIZE
              </p>
            </div>
          </Link>

          {/* Tournament Quick Selector */}
          {tournaments.length > 0 && (
            <div className="hidden md:flex items-center ml-4 pl-4 border-l border-slate-800">
              <select
                value={activeTournamentId || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    router.push(`/tournaments/${e.target.value}`);
                  } else {
                    router.push('/');
                  }
                }}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">-- All Tournaments --</option>
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.status})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right: Actions, Demo Controls, Shortcuts */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Search trigger */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 text-xs rounded-lg px-3 py-1.5 transition-colors"
            title="Global Search (/)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden sm:inline text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono border border-slate-700">
              /
            </kbd>
          </button>

          {/* Public Stage / Stream Overlay Link */}
          <Link
            href="/display"
            target="_blank"
            className="hidden lg:flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2.5 py-1.5 rounded-lg transition-colors"
            title="Open Public Stage / Stream Overlay"
          >
            <Tv className="w-3.5 h-3.5 text-blue-400" />
            <span>Public Overlay</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </Link>

          {/* Demo Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSeedDemo}
              disabled={isSeeding}
              className="text-xs bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/80 px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5"
              title="Load full 16-team realistic tournament"
            >
              <Radio className={`w-3.5 h-3.5 text-emerald-400 ${isSeeding ? 'animate-pulse' : ''}`} />
              <span className="hidden md:inline">{isSeeding ? 'Loading...' : 'Load Demo'}</span>
            </button>

            <button
              onClick={handleResetDemo}
              disabled={isResetting}
              className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              title="Reset Demo Tournament"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isResetting ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Reset</span>
            </button>
          </div>

          {/* + New Tournament Button */}
          <Link
            href="/tournaments/new"
            className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm shadow-emerald-500/20 flex items-center gap-1.5 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Tournament</span>
          </Link>

          {/* Shortcuts Help */}
          <button
            onClick={onOpenShortcuts}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            title="Keyboard Shortcuts (?)"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* User Role Badge */}
          <div className="hidden xl:flex items-center gap-2 pl-3 border-l border-slate-800">
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-left">
              <p className="text-[11px] font-semibold text-slate-200 leading-tight">Organizer</p>
              <p className="text-[9px] text-emerald-400 font-mono leading-tight">SUPER ADMIN</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
