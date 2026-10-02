'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  CheckCircle,
  XCircle,
  Lock,
  History,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export function SettingsView({
  tournamentId,
  onTournamentFinalized,
}: {
  tournamentId: string;
  onTournamentFinalized?: () => void;
}) {
  const [tournament, setTournament] = useState<any | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [tRes, aRes] = await Promise.all([
        fetch(`/api/tournaments/${tournamentId}`).then((r) => r.json()),
        fetch(`/api/tournaments/${tournamentId}/audit-logs`).then((r) => r.json()),
      ]);

      if (tRes.success) {
        setTournament(tRes.data);

        // Precompute checklist preview
        const t = tRes.data;
        const totalMatches = t.matches?.length || 0;
        const completedMatches = t.matches?.filter(
          (m: any) => m.status === 'COMPLETED' || m.status === 'VERIFIED' || m.status === 'PUBLISHED'
        ).length || 0;
        const verifiedMatches = t.matches?.filter(
          (m: any) => m.resultStatus === 'PUBLISHED' || m.resultStatus === 'VERIFIED'
        ).length || 0;
        const openDisputes = t._count?.disputes || 0;

        setChecklist([
          {
            label: 'All Scheduled Matches Completed',
            passed: totalMatches > 0 && completedMatches >= totalMatches,
            details: `${completedMatches}/${totalMatches} matches completed`,
          },
          {
            label: 'All Match Results Verified & Published',
            passed: totalMatches > 0 && verifiedMatches >= totalMatches,
            details: `${verifiedMatches}/${totalMatches} verified & published`,
          },
          {
            label: 'Zero Open Protests / Disputes',
            passed: openDisputes === 0,
            details: `${openDisputes} disputes pending`,
          },
          {
            label: 'Active Participating Squads Checked In',
            passed: (t.teams?.length || 0) >= 2,
            details: `${t.teams?.length || 0} teams registered`,
          },
        ]);
      }

      if (aRes.success) setAuditLogs(aRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tournamentId]);

  const handleFinalize = async () => {
    if (!confirm('Are you certain you want to FINALIZE this tournament? Standings will be locked and cannot be edited.')) return;
    setIsFinalizing(true);
    setFinalizeError(null);

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/finalize`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Pre-flight check failed');
      }

      fetchData();
      if (onTournamentFinalized) onTournamentFinalized();
    } catch (err: any) {
      setFinalizeError(err.message);
    } finally {
      setIsFinalizing(false);
    }
  };

  const allPassed = checklist.every((c) => c.passed);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-heading font-black tracking-wider text-white uppercase flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#ffb60e]" />
          Tournament Lifecycle & Finalization Lock
        </h2>
        <p className="text-xs text-slate-400 mt-0.5 font-sans">
          Pre-flight integrity verification, competition finalization, and immutable audit trails
        </p>
      </div>

      {finalizeError && (
        <div className="p-3 tactical-cut bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 font-mono">
          {finalizeError}
        </div>
      )}

      {/* Pre-Flight Finalization Checklist Card */}
      <div className="tactical-cut bg-[#121212] border border-white/10 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#ffb60e]" />
            <h3 className="text-lg font-heading font-black tracking-wide text-white uppercase">Pre-Flight Finalization Audit</h3>
          </div>
          {tournament?.isFinalized ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 tactical-cut bg-[#ffb60e]/20 text-[#ffb60e] border border-[#ffb60e]/40 text-xs font-bold font-mono">
              <Lock className="w-3.5 h-3.5" />
              TOURNAMENT FINALIZED & LOCKED
            </span>
          ) : (
            <span className="text-xs font-mono text-[#ffb60e] font-bold uppercase tracking-wider">
              STATUS: {tournament?.status}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {checklist.map((item, idx) => (
            <div
              key={idx}
              className={`p-3.5 tactical-cut flex items-center justify-between border ${
                item.passed
                  ? 'bg-[#0a0a0a] border-[#ffb60e]/30 text-slate-200'
                  : 'bg-[#0a0a0a] border-white/10 text-slate-400'
              }`}
            >
              <div>
                <p className="text-xs font-heading font-bold text-white uppercase tracking-wider">{item.label}</p>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">{item.details}</p>
              </div>
              {item.passed ? (
                <CheckCircle className="w-4 h-4 text-[#ffb60e]" />
              ) : (
                <XCircle className="w-4 h-4 text-slate-600" />
              )}
            </div>
          ))}
        </div>

        {!tournament?.isFinalized && (
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleFinalize}
              disabled={isFinalizing || !allPassed}
              className="tactical-btn-gold px-6 py-3 text-xs shadow-xl shadow-[#ffb60e]/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isFinalizing ? 'AUDITING & LOCKING...' : 'FINALIZE TOURNAMENT & LOCK STANDINGS'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Immutable Audit Log History */}
      <div className="tactical-cut bg-[#121212] border border-white/10 p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-white/10">
          <History className="w-4 h-4 text-[#ffb60e]" />
          <h3 className="text-lg font-heading font-black tracking-wide text-white uppercase">Immutable Tournament Audit Trail</h3>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4 font-mono">No logged actions recorded.</p>
          ) : (
            auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 tactical-cut bg-[#0a0a0a] border border-white/10 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <span className="font-mono font-bold text-[#ffb60e] mr-2 text-[10px] bg-[#1a1a1a] border border-[#ffb60e]/30 px-1.5 py-0.5 tactical-cut">
                    {log.action}
                  </span>
                  <span className="text-slate-200">{log.reason || 'Action logged'}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
