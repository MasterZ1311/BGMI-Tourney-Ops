'use client';

import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  CheckCircle,
  Clock,
  XCircle,
  ShieldAlert,
  Search,
  CheckCheck,
  Filter,
} from 'lucide-react';

export function AttendanceView({ tournamentId }: { tournamentId: string }) {
  const [data, setData] = useState<{ records: any[]; summary: any } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/attendance`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [tournamentId]);

  const markStatus = async (teamId: string, status: string) => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, status, checkedInBy: 'Chief Marshal' }),
      });
      const json = await res.json();
      if (json.success) {
        // Optimistic update
        setData((prev) => {
          if (!prev) return prev;
          const updated = prev.records.map((r) =>
            r.teamId === teamId
              ? { ...r, status, timestamp: new Date().toISOString(), checkedInBy: 'Chief Marshal' }
              : r
          );
          const present = updated.filter((r) => r.status === 'PRESENT').length;
          const late = updated.filter((r) => r.status === 'LATE').length;
          const absent = updated.filter((r) => r.status === 'ABSENT').length;
          const dq = updated.filter((r) => r.status === 'DISQUALIFIED').length;
          return {
            records: updated,
            summary: { ...prev.summary, present, late, absent, disqualified: dq },
          };
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkMarkPresent = async () => {
    if (!confirm('Mark all active squads as PRESENT?')) return;
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulkMarkAllPresent: true, checkedInBy: 'Chief Marshal' }),
      });
      const json = await res.json();
      if (json.success) {
        fetchAttendance();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredRecords = data?.records.filter((r) => {
    const matchesSearch =
      r.teamName.toLowerCase().includes(search.toLowerCase()) ||
      r.teamTag.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterStatus === 'ALL' || r.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Attendance Header & Rapid Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            Lobby Check-In & Attendance Desk
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Single-click check-in for tournament lobby marshals and staff
          </p>
        </div>

        <button
          onClick={handleBulkMarkPresent}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-md shadow-emerald-600/20 transition-all"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          Mark All Verified as Present
        </button>
      </div>

      {/* Summary Stat Strips */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Expected</span>
              <p className="text-xl font-black text-white">{data.summary.total}</p>
            </div>
            <UserCheck className="w-4 h-4 text-slate-500" />
          </div>

          <div className="bg-slate-900 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400">Present</span>
              <p className="text-xl font-black text-emerald-400">{data.summary.present}</p>
            </div>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="bg-slate-900 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400">Late / Warning</span>
              <p className="text-xl font-black text-amber-400">{data.summary.late}</p>
            </div>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>

          <div className="bg-slate-900 border border-rose-500/20 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-400">Absent / No-Show</span>
              <p className="text-xl font-black text-rose-400">{data.summary.absent}</p>
            </div>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search squad by name or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {['ALL', 'PRESENT', 'LATE', 'ABSENT'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase tracking-wider transition-colors ${
                filterStatus === status
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Attendance Table with 1-Click Status Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] bg-slate-950/60">
                <th className="py-3 px-4">Squad Name</th>
                <th className="py-3 px-4">Group</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4">Checked-In By</th>
                <th className="py-3 px-4 text-right">Quick Action (1-Click)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredRecords?.map((record) => (
                <tr key={record.teamId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{record.teamName}</span>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">
                        [{record.teamTag}]
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-4 font-mono text-slate-400">{record.group}</td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                        record.status === 'PRESENT'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : record.status === 'LATE'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {record.status === 'PRESENT' && <CheckCircle className="w-3 h-3" />}
                      {record.status === 'LATE' && <Clock className="w-3 h-3" />}
                      {record.status === 'ABSENT' && <XCircle className="w-3 h-3" />}
                      {record.status}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                    {record.checkedInBy ? (
                      <span>
                        {record.checkedInBy}{' '}
                        {record.timestamp && (
                          <span className="text-slate-600 text-[10px]">
                            ({new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-slate-600">Pending</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => markStatus(record.teamId, 'PRESENT')}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                          record.status === 'PRESENT'
                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                            : 'bg-slate-800 text-emerald-400 hover:bg-emerald-950/60 border border-emerald-500/30'
                        }`}
                      >
                        Present
                      </button>

                      <button
                        onClick={() => markStatus(record.teamId, 'LATE')}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                          record.status === 'LATE'
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'bg-slate-800 text-amber-300 hover:bg-amber-950/60 border border-amber-500/30'
                        }`}
                      >
                        Late
                      </button>

                      <button
                        onClick={() => markStatus(record.teamId, 'ABSENT')}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                          record.status === 'ABSENT'
                            ? 'bg-rose-500 text-white shadow-sm'
                            : 'bg-slate-800 text-rose-400 hover:bg-rose-950/60 border border-rose-500/30'
                        }`}
                      >
                        Absent
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
