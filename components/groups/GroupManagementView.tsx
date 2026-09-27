'use client';

import React, { useState, useEffect } from 'react';
import {
  Grid,
  Lock,
  Unlock,
  Shuffle,
  PlusCircle,
  Users,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export function GroupManagementView({ tournamentId }: { tournamentId: string }) {
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/groups`);
      const data = await res.json();
      if (data.success) {
        setGroups(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [tournamentId]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setError(null);

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNewGroupName('');
        fetchGroups();
      } else {
        setError(data.error?.message || 'Failed to create group');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRandomize = async () => {
    if (!confirm('Randomize active squads evenly across groups?')) return;
    setIsRandomizing(true);
    setError(null);

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/groups/randomize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed: Date.now() }),
      });
      const data = await res.json();
      if (data.success) {
        fetchGroups();
      } else {
        setError(data.error?.message || 'Failed to randomize groups');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRandomizing(false);
    }
  };

  const toggleGroupLock = async (isLocked: boolean) => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/groups/lock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLocked }),
      });
      const data = await res.json();
      if (data.success) {
        fetchGroups();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const anyGroupLocked = groups.some((g) => g.isLocked);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-teko uppercase font-bold tracking-wider text-white flex items-center gap-2 leading-none">
            <Grid className="w-6 h-6 text-[#ffb60e]" />
            GROUP & LOBBY ALLOCATION
          </h2>
          <p className="text-xs font-condensed uppercase tracking-wider text-gray-400 mt-1">
            ORGANIZE SQUADS INTO BALANCED LOBBIES WITH SEEDED DETERMINISTIC RANDOMIZER
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRandomize}
            disabled={isRandomizing || anyGroupLocked || groups.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-condensed uppercase font-bold tracking-wider bg-[#222222] hover:bg-[#2a2a2a] text-[#ffb60e] border border-[#ffb60e]/40 tactical-cut transition-colors disabled:opacity-50"
            title={anyGroupLocked ? 'Unlock groups before randomizing' : 'Randomize teams'}
          >
            <Shuffle className={`w-3.5 h-3.5 text-[#ffb60e] ${isRandomizing ? 'animate-spin' : ''}`} />
            {isRandomizing ? 'SHUFFLING...' : 'RANDOMIZE GROUPS'}
          </button>

          <button
            onClick={() => toggleGroupLock(!anyGroupLocked)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-condensed uppercase font-bold tracking-wider tactical-cut transition-colors ${
              anyGroupLocked
                ? 'bg-[#ffb60e] text-black font-black shadow-md shadow-[#ffb60e]/20'
                : 'bg-[#222222] text-gray-300 border border-[#444444] hover:bg-[#2a2a2a]'
            }`}
          >
            {anyGroupLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            {anyGroupLocked ? 'GROUPS LOCKED' : 'LOCK GROUPS'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 tactical-cut bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 font-condensed font-bold">
          {error}
        </div>
      )}

      {/* New Group Inline Form */}
      <form onSubmit={handleCreateGroup} className="flex gap-2">
        <input
          type="text"
          placeholder="New Group Name (e.g. Group C)..."
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          className="flex-1 max-w-xs bg-[#171716] border border-[#333333] text-white px-3 py-2 text-xs font-condensed font-bold uppercase focus:border-[#ffb60e] focus:outline-none"
        />
        <button
          type="submit"
          className="tactical-btn-gold text-xs font-teko font-bold text-black uppercase tracking-wider px-4 py-2 flex items-center gap-1.5 text-base shadow-md shadow-[#ffb60e]/20"
        >
          <PlusCircle className="w-4 h-4 text-black" />
          ADD GROUP
        </button>
      </form>

      {/* Groups Display Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {groups.map((group) => (
          <div
            key={group.id}
            className="bg-[#171716] border border-[#333333] tactical-cut p-4 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">{group.name}</span>
                {group.isLocked && <Lock className="w-3 h-3 text-amber-400" />}
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {group.teams?.length || 0} Squads
              </span>
            </div>

            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {group.teams?.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  No squads assigned yet. Click &quot;Randomize Groups&quot; to populate.
                </p>
              ) : (
                group.teams?.map((t: any, idx: number) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono text-[10px] w-4">{idx + 1}.</span>
                      <span className="font-semibold text-slate-200">{t.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">[{t.tag}]</span>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
