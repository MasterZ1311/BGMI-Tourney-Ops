'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  PlusCircle,
  XCircle,
  CheckCircle,
  FileText,
  AlertTriangle,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

export function PenaltyManagementView({ tournamentId }: { tournamentId: string }) {
  const [penalties, setPenalties] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New penalty form
  const [form, setForm] = useState({
    teamId: '',
    matchId: '',
    pointsDeducted: 2,
    reason: '',
    evidenceUrl: '',
  });

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [pRes, tRes, mRes] = await Promise.all([
        fetch(`/api/tournaments/${tournamentId}/penalties`).then((r) => r.json()),
        fetch(`/api/tournaments/${tournamentId}/teams`).then((r) => r.json()),
        fetch(`/api/tournaments/${tournamentId}/matches`).then((r) => r.json()),
      ]);

      if (pRes.success) setPenalties(pRes.data);
      if (tRes.success) setTeams(tRes.data);
      if (mRes.success) setMatches(mRes.data);
    } catch (err: any) {
      console.error(err);
      setError('Unable to fetch tournament penalty ledger.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tournamentId]);

  const handleIssuePenalty = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.teamId || !form.reason.trim()) {
      setError('Please select a squad and provide a reason.');
      return;
    }

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/penalties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: form.teamId,
          matchId: form.matchId || undefined,
          pointsDeducted: Number(form.pointsDeducted),
          reason: form.reason.trim(),
          evidenceUrl: form.evidenceUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to issue penalty');
      }

      setIsModalOpen(false);
      setForm({ teamId: '', matchId: '', pointsDeducted: 2, reason: '', evidenceUrl: '' });
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleVoidPenalty = async (penaltyId: string) => {
    if (!confirm('Are you sure you want to void this penalty? Points will be restored to the squad.')) return;
    try {
      const res = await fetch(`/api/penalties/${penaltyId}/void`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Penalty voided upon appeal review' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-black tracking-wider text-white uppercase flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-500" />
            Tournament Penalty Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">
            Deduct points for late lobby arrivals, unauthorized roster substitutions, or rulebook violations
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="tactical-cut bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 font-heading font-black tracking-wider uppercase text-xs shadow-lg shadow-rose-600/20 transition-all flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          Issue Penalty
        </button>
      </div>

      {/* Error Banner */}
      {error && !isModalOpen && (
        <div className="p-3 tactical-cut bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchData}
            className="px-2.5 py-1 text-[11px] font-bold bg-rose-500/30 hover:bg-rose-500/50 text-white tactical-cut transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Penalties Table */}
      <div className="tactical-cut bg-[#101010] border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-mono text-[11px] bg-[#0a0a0a] uppercase tracking-wider">
                <th className="py-3.5 px-4 font-bold">Penalized Squad</th>
                <th className="py-3.5 px-4 font-bold">Associated Match</th>
                <th className="py-3.5 px-4 font-bold text-center">Deduction</th>
                <th className="py-3.5 px-4 font-bold">Violation Reason</th>
                <th className="py-3.5 px-4 font-bold">Issued By</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 text-[#ffb60e] animate-spin" />
                      <span className="text-xs font-mono text-[#ffb60e]">LOADING PENALTY LEDGER...</span>
                    </div>
                  </td>
                </tr>
              ) : penalties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <ShieldAlert className="w-8 h-8 text-[#ffb60e]/50 mb-1" />
                      <span className="font-heading text-lg font-bold text-slate-200 uppercase tracking-wide">Clean Integrity Record</span>
                      <span className="text-xs text-slate-500 font-sans">No active penalties issued. Tournament integrity record is clean.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                penalties.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-heading text-base font-bold text-white tracking-wide">{p.team?.name}</span>
                        <span className="tactical-cut bg-[#ffb60e]/15 text-[#ffb60e] font-mono text-[10px] font-bold px-1.5 py-0.5 ml-1.5 border border-[#ffb60e]/30">
                          [{p.team?.tag}]
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {p.match?.title || 'General Tournament'}
                    </td>

                    <td className="py-3.5 px-4 text-center font-heading font-black text-rose-500 text-lg">
                      -{p.pointsDeducted} PTS
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 max-w-xs">{p.reason}</td>

                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                      {p.issuedBy}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-1 tactical-cut ${
                          p.status === 'ACTIVE'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : 'bg-[#1a1a1a] text-slate-400 border border-white/10'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {p.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleVoidPenalty(p.id)}
                          className="px-3 py-1 text-[10px] font-heading font-black uppercase tracking-wider bg-[#1c1c1c] hover:bg-[#282828] text-slate-300 tactical-cut border border-white/10 transition-colors"
                        >
                          Void Penalty
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Penalty Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="tactical-cut bg-[#121212] border border-white/10 max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-heading font-black text-white flex items-center gap-2 uppercase tracking-wide">
              <AlertOctagon className="w-5 h-5 text-rose-500" />
              Issue Penalty to Squad
            </h3>

            {error && (
              <div className="p-2.5 tactical-cut bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 font-mono">
                {error}
              </div>
            )}

            <form onSubmit={handleIssuePenalty} className="space-y-3">
              <div>
                <label className="text-xs font-heading font-bold text-slate-300 block mb-1 uppercase tracking-wider">
                  Select Squad *
                </label>
                <select
                  value={form.teamId}
                  onChange={(e) => setForm({ ...form, teamId: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-white/10 text-white tactical-cut px-3 py-2 text-xs focus:border-[#ffb60e]"
                >
                  <option value="">-- Choose Squad --</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} [{t.tag}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-heading font-bold text-slate-300 block mb-1 uppercase tracking-wider">
                  Applicable Match (Optional)
                </label>
                <select
                  value={form.matchId}
                  onChange={(e) => setForm({ ...form, matchId: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-white/10 text-white tactical-cut px-3 py-2 text-xs focus:border-[#ffb60e]"
                >
                  <option value="">General Tournament Penalty</option>
                  {matches.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-heading font-bold text-slate-300 block mb-1 uppercase tracking-wider">
                  Points to Deduct *
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={form.pointsDeducted}
                  onChange={(e) => setForm({ ...form, pointsDeducted: Number(e.target.value) })}
                  className="w-full bg-[#0a0a0a] border border-white/10 text-white tactical-cut px-3 py-2 text-xs font-mono font-bold focus:border-[#ffb60e]"
                />
              </div>

              <div>
                <label className="text-xs font-heading font-bold text-slate-300 block mb-1 uppercase tracking-wider">
                  Reason / Rule Violation *
                </label>
                <textarea
                  rows={2}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="e.g. Late lobby arrival (Rule 4.2), Unregistered substitute..."
                  className="w-full bg-[#0a0a0a] border border-white/10 text-white tactical-cut px-3 py-2 text-xs focus:border-[#ffb60e]"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white uppercase font-mono"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-heading font-black tracking-wider uppercase bg-rose-600 hover:bg-rose-500 text-white tactical-cut shadow-md shadow-rose-600/20"
                >
                  Apply Deduction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
