'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  PlusCircle,
  XCircle,
  CheckCircle,
  FileText,
  UserAlert,
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
    try {
      const [pRes, tRes, mRes] = await Promise.all([
        fetch(`/api/tournaments/${tournamentId}/penalties`).then((r) => r.json()),
        fetch(`/api/tournaments/${tournamentId}/teams`).then((r) => r.json()),
        fetch(`/api/tournaments/${tournamentId}/matches`).then((r) => r.json()),
      ]);

      if (pRes.success) setPenalties(pRes.data);
      if (tRes.success) setTeams(tRes.data);
      if (mRes.success) setMatches(mRes.data);
    } catch (err) {
      console.error(err);
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
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-400" />
            Tournament Penalty Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Deduct points for late lobby arrivals, unauthorized roster substitutions, or rulebook violations
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-md shadow-rose-600/20 transition-all"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Issue Penalty
        </button>
      </div>

      {/* Penalties Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] bg-slate-950/60">
                <th className="py-3 px-4">Penalized Squad</th>
                <th className="py-3 px-4">Associated Match</th>
                <th className="py-3 px-4 text-center">Deduction</th>
                <th className="py-3 px-4">Violation Reason</th>
                <th className="py-3 px-4">Issued By</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {penalties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No active penalties issued. Tournament integrity record is clean.
                  </td>
                </tr>
              ) : (
                penalties.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-bold text-white">{p.team?.name}</span>
                        <span className="text-[10px] text-emerald-400 font-mono ml-1.5">
                          [{p.team?.tag}]
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-400">
                      {p.match?.title || 'General Tournament'}
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-black text-rose-400 text-sm">
                      -{p.pointsDeducted} pts
                    </td>

                    <td className="py-3 px-4 text-slate-300 max-w-xs">{p.reason}</td>

                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {p.issuedBy}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                          p.status === 'ACTIVE'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {p.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleVoidPenalty(p.id)}
                          className="px-2.5 py-1 text-[10px] font-bold uppercase bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-rose-400" />
              Issue Penalty to Squad
            </h3>

            {error && (
              <div className="p-2.5 rounded bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleIssuePenalty} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Select Squad *
                </label>
                <select
                  value={form.teamId}
                  onChange={(e) => setForm({ ...form, teamId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
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
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Applicable Match (Optional)
                </label>
                <select
                  value={form.matchId}
                  onChange={(e) => setForm({ ...form, matchId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
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
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Points to Deduct *
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={form.pointsDeducted}
                  onChange={(e) => setForm({ ...form, pointsDeducted: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs font-mono font-bold focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Reason / Rule Violation *
                </label>
                <textarea
                  rows={2}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="e.g. Late lobby arrival (Rule 4.2), Unregistered substitute..."
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-sm"
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
