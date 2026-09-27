'use client';

import React, { useState, useEffect } from 'react';
import { Scale, PlusCircle, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

export function DisputeManagementView({ tournamentId }: { tournamentId: string }) {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionStatus, setResolutionStatus] = useState('RESOLVED');

  const [form, setForm] = useState({
    teamId: '',
    matchId: '',
    category: 'SCORING',
    description: '',
    evidenceUrl: '',
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [dRes, tRes, mRes] = await Promise.all([
        fetch(`/api/tournaments/${tournamentId}/disputes`).then((r) => r.json()),
        fetch(`/api/tournaments/${tournamentId}/teams`).then((r) => r.json()),
        fetch(`/api/tournaments/${tournamentId}/matches`).then((r) => r.json()),
      ]);

      if (dRes.success) setDisputes(dRes.data);
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

  const handleFileDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.teamId || !form.description.trim()) return;

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/disputes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setForm({ teamId: '', matchId: '', category: 'SCORING', description: '', evidenceUrl: '' });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolve = async (disputeId: string) => {
    try {
      const res = await fetch(`/api/disputes/${disputeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: resolutionStatus,
          resolutionNotes,
          resolvedBy: 'Tournament Director',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResolvingId(null);
        setResolutionNotes('');
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
            <Scale className="w-5 h-5 text-amber-300" />
            Integrity & Dispute Desk
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Log and adjudicate team protests, elimination credit challenges, or rule infractions
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-lg shadow-md shadow-amber-600/20 transition-all"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          File Squad Protest
        </button>
      </div>

      {/* Disputes List */}
      <div className="space-y-3">
        {disputes.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl">
            <Scale className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-300">No Open Disputes</p>
            <p className="text-xs text-slate-500 mt-1">
              All protests and inquiries have been resolved.
            </p>
          </div>
        ) : (
          disputes.map((d) => (
            <div
              key={d.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{d.team?.name}</span>
                  <span className="text-[10px] text-emerald-400 font-mono">[{d.team?.tag}]</span>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono uppercase">
                    {d.category}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                      d.status === 'OPEN'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : d.status === 'UNDER_REVIEW'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}
                  >
                    {d.status}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-200">{d.description}</p>

              {d.resolutionNotes && (
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-emerald-300 font-mono">
                  <strong>Resolution:</strong> {d.resolutionNotes} (by {d.resolvedBy || 'Admin'})
                </div>
              )}

              {/* Action */}
              {d.status !== 'RESOLVED' && d.status !== 'REJECTED' && (
                <div className="pt-2 flex justify-end">
                  {resolvingId === d.id ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        placeholder="Resolution outcome & notes..."
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-700 text-white rounded px-2.5 py-1 text-xs"
                      />
                      <select
                        value={resolutionStatus}
                        onChange={(e) => setResolutionStatus(e.target.value)}
                        className="bg-slate-950 border border-slate-700 text-white rounded px-2 py-1 text-xs"
                      >
                        <option value="RESOLVED">Accept / Resolve</option>
                        <option value="REJECTED">Reject Protest</option>
                      </select>
                      <button
                        onClick={() => handleResolve(d.id)}
                        className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded"
                      >
                        Submit
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setResolvingId(d.id)}
                      className="px-3 py-1 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700"
                    >
                      Adjudicate / Resolve
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* File Dispute Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-300" />
              File Squad Protest / Dispute
            </h3>

            <form onSubmit={handleFileDispute} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Protesting Squad *
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
                  Associated Match
                </label>
                <select
                  value={form.matchId}
                  onChange={(e) => setForm({ ...form, matchId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">General Tournament</option>
                  {matches.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="SCORING">Scoring / Elimination Credit</option>
                  <option value="ROSTER">Unauthorized Substitute / Roster Swap</option>
                  <option value="CHEATING">Hacking / Teaming / Emulators</option>
                  <option value="DISCONNECT">Lobby Disconnect / Remake Request</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Protest Description *
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Detail the issue, player IGNs involved, and timestamp..."
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
                  className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-lg shadow-sm"
                >
                  Submit Dispute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
