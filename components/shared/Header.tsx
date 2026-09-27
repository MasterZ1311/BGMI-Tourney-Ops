'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
    <header className="border-b border-[#2e2e2e] bg-[#0c0c0c]/95 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-2.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Brand & Selector */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 bg-black border border-[#ffb60e]/50 flex items-center justify-center tactical-cut shadow-md shadow-[#ffb60e]/20 group-hover:scale-105 group-hover:border-[#ffb60e] transition-all overflow-hidden p-1">
              <Image
                src="/images/logos/bgmi_icon.svg"
                alt="BGMI"
                width={32}
                height={32}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-teko uppercase text-2xl font-bold tracking-wider text-white group-hover:text-[#ffb60e] transition-colors leading-none">
                  BGMI <span className="text-[#ffb60e]">TCC</span>
                </span>
                <span className="text-[10px] uppercase font-condensed font-bold tracking-widest px-2 py-0.5 tactical-cut bg-[#ffb60e]/15 text-[#ffb60e] border border-[#ffb60e]/40">
                  COMMAND CENTER
                </span>
              </div>
              <p className="text-[11px] text-[#888888] font-condensed uppercase tracking-wider hidden sm:block">
                PLAN <span className="text-[#ffb60e]">•</span> RUN <span className="text-[#ffb60e]">•</span> SCORE <span className="text-[#ffb60e]">•</span> FINALIZE
              </p>
            </div>
          </Link>

          {/* Tournament Quick Selector */}
          {tournaments.length > 0 && (
            <div className="hidden md:flex items-center ml-4 pl-4 border-l border-[#2e2e2e]">
              <select
                value={activeTournamentId || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    router.push(`/tournaments/${e.target.value}`);
                  } else {
                    router.push('/');
                  }
                }}
                className="bg-[#171716] border border-[#333333] text-gray-200 text-xs px-3 py-1.5 focus:outline-none focus:border-[#ffb60e] font-sans"
              >
                <option value="">-- ALL TOURNAMENTS --</option>
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
            className="flex items-center gap-2 bg-[#171716] hover:bg-[#1f1f1f] border border-[#333333] hover:border-[#ffb60e]/50 text-gray-400 hover:text-white text-xs px-3 py-1.5 transition-colors"
            title="Global Search (/)"
          >
            <Search className="w-3.5 h-3.5 text-[#ffb60e]" />
            <span className="hidden sm:inline font-sans text-xs">Search...</span>
            <kbd className="hidden sm:inline text-[10px] bg-[#222222] px-1.5 py-0.5 text-gray-400 font-condensed border border-[#444444]">
              /
            </kbd>
          </button>

          {/* Public Stage / Stream Overlay Link */}
          <Link
            href="/display"
            target="_blank"
            className="hidden lg:flex items-center gap-1.5 text-xs text-gray-300 hover:text-[#ffb60e] bg-[#171716] hover:bg-[#1f1f1f] border border-[#333333] hover:border-[#ffb60e]/50 px-2.5 py-1.5 transition-colors font-condensed font-semibold tracking-wide uppercase"
            title="Open Public Stage / Stream Overlay"
          >
            <Tv className="w-3.5 h-3.5 text-[#ffb60e]" />
            <span>Overlay</span>
            <ExternalLink className="w-3 h-3 text-gray-500" />
          </Link>

          {/* Demo Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSeedDemo}
              disabled={isSeeding}
              className="text-xs bg-[#ffb60e]/10 hover:bg-[#ffb60e]/20 text-[#ffb60e] border border-[#ffb60e]/40 px-2.5 py-1.5 font-condensed uppercase tracking-wider font-semibold transition-colors flex items-center gap-1.5"
              title="Load full 16-team realistic tournament"
            >
              <Radio className={`w-3.5 h-3.5 text-[#ffb60e] ${isSeeding ? 'animate-pulse' : ''}`} />
              <span className="hidden md:inline">{isSeeding ? 'Loading...' : 'Demo'}</span>
            </button>

            <button
              onClick={handleResetDemo}
              disabled={isResetting}
              className="text-xs bg-[#171716] hover:bg-[#1f1f1f] text-gray-300 border border-[#333333] px-2.5 py-1.5 transition-colors flex items-center gap-1.5 font-condensed uppercase tracking-wider"
              title="Reset Demo Tournament"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${isResetting ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Reset</span>
            </button>
          </div>

          {/* + New Tournament Button */}
          <Link
            href="/tournaments/new"
            className="tactical-btn-gold text-xs font-teko font-bold text-black uppercase tracking-wider px-3.5 py-1.5 flex items-center gap-1.5 text-base"
          >
            <PlusCircle className="w-4 h-4 text-black" />
            <span className="hidden sm:inline">NEW TOURNAMENT</span>
          </Link>

          {/* Shortcuts Help */}
          <button
            onClick={onOpenShortcuts}
            className="p-1.5 text-gray-400 hover:text-[#ffb60e] hover:bg-[#171716] border border-transparent hover:border-[#333333] transition-colors"
            title="Keyboard Shortcuts (?)"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* User Role Badge */}
          <div className="hidden xl:flex items-center gap-2 pl-3 border-l border-[#2e2e2e]">
            <div className="w-7 h-7 bg-[#171716] border border-[#ffb60e]/40 flex items-center justify-center text-[#ffb60e]">
              <Shield className="w-3.5 h-3.5 text-[#ffb60e]" />
            </div>
            <div className="text-left font-condensed">
              <p className="text-[11px] font-bold text-gray-200 uppercase leading-tight tracking-wide">ORGANIZER</p>
              <p className="text-[10px] text-[#ffb60e] font-bold uppercase leading-tight tracking-wider">SUPER ADMIN</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
