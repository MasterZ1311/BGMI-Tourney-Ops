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
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Squads & Roster Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {teams.length} teams registered • {teams.filter((t) => t.verificationStatus === 'VERIFIED').length} verified squads
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBulkOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            Bulk CSV Import
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter squads by Team Name, Tag, or Player IGN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* Teams Grid / Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] bg-slate-950/60">
                <th className="py-3 px-4">Team</th>
                <th className="py-3 px-4">Group</th>
                <th className="py-3 px-4">Starting Roster (4)</th>
                <th className="py-3 px-4">Bench</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredTeams.map((team) => {
                const starters = team.players?.filter((p: any) => !p.isSubstitute) || [];
                const subs = team.players?.filter((p: any) => p.isSubstitute) || [];

                return (
                  <tr key={team.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-bold text-white text-sm">{team.name}</span>
                        <div className="flex items-center gap-2 mt-0.5 font-mono text-[10px] text-slate-500">
                          <span className="text-emerald-400 font-bold">[{team.tag}]</span>
                          <span>Cap: {team.captainName || starters[0]?.ign || 'N/A'}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-xs font-mono text-slate-300">
                        {team.group?.name || 'Unallocated'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {starters.map((p: any) => (
                          <span
                            key={p.id}
                            className="inline-block px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700/80"
                            title={`UID: ${p.characterId} • Role: ${p.role}`}
                          >
                            {p.ign}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {subs.length > 0 ? (
                          subs.map((p: any) => (
                            <span
                              key={p.id}
                              className="inline-block px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px] font-mono border border-amber-500/20"
                            >
                              {p.ign}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-600 text-[10px] font-mono">None</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleVerification(team.id, team.verificationStatus)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                          team.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                        }`}
                      >
                        <UserCheck className="w-3 h-3" />
                        {team.verificationStatus}
                      </button>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          team.status === 'ACTIVE'
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : 'text-rose-400 bg-rose-500/10 border border-rose-500/30'
                        }`}
                      >
                        {team.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedTeam(team)}
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                          title="View Complete Roster with Character UIDs"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDisqualify(team.id, team.status)}
                          className={`p-1 rounded transition-colors ${
                            team.status === 'DISQUALIFIED'
                              ? 'text-emerald-400 hover:bg-emerald-950/60'
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  {selectedTeam.name}
                  <span className="text-xs font-mono text-emerald-400">[{selectedTeam.tag}]</span>
                </h3>
                <p className="text-xs text-slate-400">Verified BGMI Roster Details</p>
              </div>
              <button
                onClick={() => setSelectedTeam(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {selectedTeam.players?.map((p: any) => (
                <div
                  key={p.id}
                  className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{p.ign}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({p.name})</span>
                      {p.isSubstitute && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded font-bold">
                          SUB
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400">
                      UID: {p.characterId}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                    {p.role}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedTeam(null)}
                className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
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
