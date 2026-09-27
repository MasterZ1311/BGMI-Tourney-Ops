'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  PlusCircle,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  Search,
  ShieldAlert,
  UserCheck,
  Eye,
  Trash2,
} from 'lucide-react';
import { BulkImportModal } from './BulkImportModal';

export function TeamManagementView({ tournamentId }: { tournamentId: string }) {
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);

  const fetchTeams = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/teams`);
      const data = await res.json();
      if (data.success) {
        setTeams(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [tournamentId]);

  const toggleVerification = async (teamId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'VERIFIED' ? 'PENDING' : 'VERIFIED';
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationStatus: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setTeams((prev) =>
          prev.map((t) => (t.id === teamId ? { ...t, verificationStatus: newStatus } : t))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDisqualify = async (teamId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'DISQUALIFIED' ? 'ACTIVE' : 'DISQUALIFIED';
    const actionLabel = newStatus === 'DISQUALIFIED' ? 'disqualify' : 'reinstate';
    if (!confirm(`Are you sure you want to ${actionLabel} this team?`)) return;

    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setTeams((prev) =>
          prev.map((t) => (t.id === teamId ? { ...t, status: newStatus } : t))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.tag.toLowerCase().includes(search.toLowerCase()) ||
      t.players?.some((p: any) => p.ign.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-black tracking-wider text-white uppercase flex items-center gap-2">
            <Users className="w-5 h-5 text-[#ffb60e]" />
            Squads & Roster Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">
            {teams.length} teams registered • <span className="text-[#ffb60e] font-bold">{teams.filter((t) => t.verificationStatus === 'VERIFIED').length}</span> verified squads
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBulkOpen(true)}
            className="tactical-btn-gold px-4 py-2 text-xs uppercase tracking-wider font-heading font-black flex items-center gap-2 shadow-lg shadow-[#ffb60e]/15"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Bulk CSV Import
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3 bg-[#121212] border border-white/10 tactical-cut p-3 focus-within:border-[#ffb60e]/50 transition-all">
        <Search className="w-4 h-4 text-[#ffb60e]" />
        <input
          type="text"
          placeholder="Filter squads by Team Name, Tag, or Player IGN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-sans"
        />
      </div>

      {/* Teams Grid / Table */}
      <div className="tactical-cut bg-[#101010] border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-mono text-[11px] bg-[#0a0a0a] uppercase tracking-wider">
                <th className="py-3.5 px-4 font-bold">Team</th>
                <th className="py-3.5 px-4 font-bold">Group</th>
                <th className="py-3.5 px-4 font-bold">Starting Roster (4)</th>
                <th className="py-3.5 px-4 font-bold">Bench</th>
                <th className="py-3.5 px-4 font-bold">Verification</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {filteredTeams.map((team) => {
                const starters = team.players?.filter((p: any) => !p.isSubstitute) || [];
                const subs = team.players?.filter((p: any) => p.isSubstitute) || [];

                return (
                  <tr key={team.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-heading text-base font-bold text-white tracking-wide">{team.name}</span>
                        <div className="flex items-center gap-2 mt-0.5 font-mono text-[10px] text-slate-400">
                          <span className="tactical-cut bg-[#ffb60e]/15 text-[#ffb60e] font-bold px-1.5 py-0.5 border border-[#ffb60e]/30">
                            [{team.tag}]
                          </span>
                          <span>Cap: {team.captainName || starters[0]?.ign || 'N/A'}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-xs font-mono text-slate-300 font-bold bg-[#181818] px-2 py-0.5 tactical-cut border border-white/10">
                        {team.group?.name || 'Unallocated'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {starters.map((p: any) => (
                          <span
                            key={p.id}
                            className="inline-block px-2 py-0.5 tactical-cut bg-[#161616] text-slate-200 text-[10px] font-mono border border-white/10"
                            title={`UID: ${p.characterId} • Role: ${p.role}`}
                          >
                            {p.ign}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {subs.length > 0 ? (
                          subs.map((p: any) => (
                            <span
                              key={p.id}
                              className="inline-block px-2 py-0.5 tactical-cut bg-[#ffb60e]/10 text-[#ffb60e] text-[10px] font-mono border border-[#ffb60e]/30"
                            >
                              {p.ign}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-600 text-[10px] font-mono">None</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => toggleVerification(team.id, team.verificationStatus)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 tactical-cut text-[10px] font-bold uppercase tracking-wider transition-colors ${
                          team.verificationStatus === 'VERIFIED'
                            ? 'bg-[#ffb60e]/15 text-[#ffb60e] border border-[#ffb60e]/40 hover:bg-[#ffb60e]/25'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25'
                        }`}
                      >
                        <UserCheck className="w-3 h-3" />
                        {team.verificationStatus}
                      </button>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 tactical-cut ${
                          team.status === 'ACTIVE'
                            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30'
                            : 'text-rose-400 bg-rose-500/10 border border-rose-500/30'
                        }`}
                      >
                        {team.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedTeam(team)}
                          className="p-1.5 text-slate-400 hover:text-white tactical-cut hover:bg-white/10 transition-colors"
                          title="View Complete Roster with Character UIDs"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDisqualify(team.id, team.status)}
                          className={`p-1.5 tactical-cut transition-colors ${
                            team.status === 'DISQUALIFIED'
                              ? 'text-[#ffb60e] hover:bg-[#ffb60e]/20'
                              : 'text-rose-400 hover:bg-rose-950/60'
                          }`}
                          title={team.status === 'DISQUALIFIED' ? 'Reinstate Team' : 'Disqualify Team'}
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Roster Details Drawer / Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="tactical-cut bg-[#121212] border border-white/10 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-xl font-heading font-black text-white flex items-center gap-2 uppercase tracking-wide">
                  {selectedTeam.name}
                  <span className="text-xs font-mono text-[#ffb60e]">[{selectedTeam.tag}]</span>
                </h3>
                <p className="text-xs text-slate-400 font-sans">Verified BGMI Roster Details</p>
              </div>
              <button
                onClick={() => setSelectedTeam(null)}
                className="text-slate-400 hover:text-white p-1 tactical-cut hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {selectedTeam.players?.map((p: any) => (
                <div
                  key={p.id}
                  className="p-3 tactical-cut bg-[#0a0a0a] border border-white/10 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{p.ign}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({p.name})</span>
                      {p.isSubstitute && (
                        <span className="text-[9px] bg-[#ffb60e]/20 text-[#ffb60e] border border-[#ffb60e]/40 px-1 tactical-cut font-bold">
                          SUB
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-[#ffb60e]">
                      UID: {p.characterId}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-[#1e1e1e] text-slate-300 px-2 py-0.5 tactical-cut border border-white/10">
                    {p.role}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setSelectedTeam(null)}
                className="px-5 py-2 text-xs font-heading font-black tracking-wider uppercase bg-[#1f1f1f] hover:bg-[#2a2a2a] text-white tactical-cut transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        tournamentId={tournamentId}
        onImportComplete={fetchTeams}
      />
    </div>
  );
}
