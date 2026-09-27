'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Trophy, Users, Crosshair, DoorOpen, ArrowRight } from 'lucide-react';

interface SearchItem {
  id: string;
  type: 'tournament' | 'team' | 'match' | 'room';
  title: string;
  subtitle: string;
  href: string;
}

export function QuickSearchModal({
  isOpen,
  onClose,
  tournamentId,
}: {
  isOpen: boolean;
  onClose: () => void;
  tournamentId?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<SearchItem[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    // Load searchable items
    const fetchSearchData = async () => {
      const searchItems: SearchItem[] = [];

      try {
        // Tournaments
        const tRes = await fetch('/api/tournaments').then((r) => r.json());
        if (tRes.success && tRes.data) {
          tRes.data.forEach((t: any) => {
            searchItems.push({
              id: t.id,
              type: 'tournament',
              title: t.name,
              subtitle: `Status: ${t.status} • Organizer: ${t.organizer}`,
              href: `/tournaments/${t.id}`,
            });
          });
        }

        // Teams & Matches if tournamentId is present
        const tId = tournamentId || (tRes.data && tRes.data[0]?.id);
        if (tId) {
          const [teamRes, matchRes] = await Promise.all([
            fetch(`/api/tournaments/${tId}/teams`).then((r) => r.json()),
            fetch(`/api/tournaments/${tId}/matches`).then((r) => r.json()),
          ]);

          if (teamRes.success && teamRes.data) {
            teamRes.data.forEach((team: any) => {
              const igns = team.players?.map((p: any) => p.ign).join(', ') || '';
              searchItems.push({
                id: team.id,
                type: 'team',
                title: `${team.name} [${team.tag}]`,
                subtitle: `Roster: ${igns || 'No players recorded'}`,
                href: `/tournaments/${tId}?tab=teams&teamId=${team.id}`,
              });
            });
          }

          if (matchRes.success && matchRes.data) {
            matchRes.data.forEach((match: any) => {
              searchItems.push({
                id: match.id,
                type: 'match',
                title: match.title,
                subtitle: `Map: ${match.map} • Status: ${match.status} • Room: ${match.room?.roomName || 'Pending'}`,
                href: `/tournaments/${tId}?tab=matches&matchId=${match.id}`,
              });

              if (match.room?.roomId) {
                searchItems.push({
                  id: match.room.id,
                  type: 'room',
                  title: `Room: ${match.room.roomName} (ID: ${match.room.roomId})`,
                  subtitle: `Map: ${match.map} • Match #${match.matchNumber}`,
                  href: `/tournaments/${tId}?tab=rooms`,
                });
              }
            });
          }
        }

        setItems(searchItems);
      } catch (err) {
        console.error('Error indexing search items:', err);
      }
    };

    fetchSearchData();
  }, [isOpen, tournamentId]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items.slice(0, 8);
    const q = query.toLowerCase();
    return items
      .filter((i) => i.title.toLowerCase().includes(q) || i.subtitle.toLowerCase().includes(q))
      .slice(0, 10);
  }, [items, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
      <div className="tactical-cut bg-[#121212] border border-white/10 max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 bg-[#0a0a0a]">
          <Search className="w-4 h-4 text-[#ffb60e] mr-2.5 shrink-0" />
          <input
            type="text"
            placeholder="Search teams, players, matches, rooms, maps..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-sans"
          />
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 tactical-cut hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 font-mono">
              No matching tournaments, squads, or matches found for &quot;{query}&quot;.
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => {
                    onClose();
                    router.push(item.href);
                  }}
                  className="w-full flex items-center justify-between p-2.5 tactical-cut hover:bg-white/[0.04] transition-colors text-left group border border-transparent hover:border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 tactical-cut bg-[#181818] border border-white/10 flex items-center justify-center text-slate-400 group-hover:text-[#ffb60e] group-hover:border-[#ffb60e]/30 transition-colors">
                      {item.type === 'tournament' && <Trophy className="w-4 h-4" />}
                      {item.type === 'team' && <Users className="w-4 h-4" />}
                      {item.type === 'match' && <Crosshair className="w-4 h-4" />}
                      {item.type === 'room' && <DoorOpen className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-heading font-bold text-slate-200 group-hover:text-white uppercase tracking-wide">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate max-w-sm font-sans">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#ffb60e] transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-[#0a0a0a] border-t border-white/10 text-[10px] text-slate-400 font-mono flex justify-between items-center">
          <span>Search tournaments, teams, character IDs, or maps</span>
          <span className="text-[#ffb60e]">ESC TO EXIT</span>
        </div>
      </div>
    </div>
  );
}
