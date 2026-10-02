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
  Loader2,
  RefreshCw,
  AlertTriangle,
  Ban,
} from 'lucide-react';

export function AttendanceView({ tournamentId }: { tournamentId: string }) {
  const [data, setData] = useState<{ records: any[]; summary: any } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const fetchAttendance = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/attendance`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error?.message || 'Failed to fetch attendance data');
      }
    } catch (err: any) {
      console.error(err);
      setError('Network error while loading attendance. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [tournamentId]);

  const markStatus = async (teamId: string, status: string) => {
    setError(null);
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
      } else {
        setError(json.error?.message || 'Failed to update squad status');
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to update status due to network error.');
    }
  };

  const handleBulkMarkPresent = async () => {
    if (!confirm('Mark all active squads as PRESENT?')) return;
    setError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulkMarkAllPresent: true, checkedInBy: 'Chief Marshal' }),
      });
      const json = await res.json();
      if (json.success) {
        fetchAttendance();
      } else {
        setError(json.error?.message || 'Failed to mark all present');
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to execute bulk check-in.');
    }
  };

  const filteredRecords = data?.records.filter((r) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      r.teamName?.toLowerCase().includes(query) ||
      r.teamTag?.toLowerCase().includes(query) ||
      r.captainName?.toLowerCase().includes(query) ||
      r.captainUid?.toString().includes(query) ||
      r.characterId?.toString().includes(query);
    const matchesFilter = filterStatus === 'ALL' || r.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Attendance Header & Rapid Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-teko uppercase font-bold tracking-wider text-white flex items-center gap-2 leading-none">
            <UserCheck className="w-6 h-6 text-[#ffb60e]" />
            LOBBY CHECK-IN & ATTENDANCE DESK
          </h2>
          <p className="text-xs font-condensed uppercase tracking-wider text-gray-400 mt-1">
            RAPID CHECK-IN FOR LOBBY MARSHALS, REFEREE DESK, AND ROOM COORDINATORS
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAttendance}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-[#ffb60e] bg-[#171716] border border-[#333333] hover:bg-[#222222] tactical-cut transition-colors"
            title="Refresh Attendance"
            aria-label="Refresh Attendance"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#ffb60e]' : ''}`} />
          </button>

          <button
            onClick={handleBulkMarkPresent}
            className="tactical-btn-gold px-4 py-2 text-xs flex items-center gap-1.5 shadow-md shadow-[#ffb60e]/20"
          >
            <CheckCheck className="w-4 h-4 text-black stroke-[2.5]" />
            <span>MARK ALL VERIFIED AS PRESENT</span>
          </button>
        </div>
      </div>

      {/* Error State Banner */}
      {error && (
        <div className="p-3 tactical-cut bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 flex items-center justify-between font-condensed font-bold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchAttendance}
            className="px-2.5 py-1 text-[11px] font-bold bg-rose-500/30 hover:bg-rose-500/50 text-white tactical-cut transition-colors"
          >
            RETRY
          </button>
        </div>
      )}

      {/* Summary Stat Strips */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-[#171716] border border-[#333333] tactical-cut p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-condensed font-bold text-gray-400">TOTAL EXPECTED</span>
              <p className="text-2xl font-teko font-bold text-white leading-none mt-0.5">{data.summary.total}</p>
            </div>
            <UserCheck className="w-5 h-5 text-gray-500" />
          </div>

          <div className="bg-[#171716] border border-emerald-500/30 tactical-cut p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-condensed font-bold text-emerald-400">PRESENT</span>
              <p className="text-2xl font-teko font-bold text-emerald-400 leading-none mt-0.5">{data.summary.present}</p>
            </div>
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="bg-[#171716] border border-[#ffb60e]/30 tactical-cut p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-condensed font-bold text-[#ffb60e]">LATE / WARNING</span>
              <p className="text-2xl font-teko font-bold text-[#ffb60e] leading-none mt-0.5">{data.summary.late}</p>
            </div>
            <Clock className="w-5 h-5 text-[#ffb60e]" />
          </div>

          <div className="bg-[#171716] border border-rose-500/30 tactical-cut p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-condensed font-bold text-rose-400">ABSENT / NO-SHOW</span>
              <p className="text-2xl font-teko font-bold text-rose-400 leading-none mt-0.5">{data.summary.absent}</p>
            </div>
            <XCircle className="w-5 h-5 text-rose-400" />
          </div>

          <div className="bg-[#171716] border border-purple-500/30 tactical-cut p-3 flex items-center justify-between col-span-2 sm:col-span-1">
            <div>
              <span className="text-[10px] uppercase font-condensed font-bold text-purple-400">DISQUALIFIED</span>
              <p className="text-2xl font-teko font-bold text-purple-400 leading-none mt-0.5">{data.summary.disqualified || 0}</p>
            </div>
            <Ban className="w-5 h-5 text-purple-400" />
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#171716] border border-[#333333] tactical-cut p-3">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
          <Search className="w-4 h-4 text-[#ffb60e] shrink-0" />
          <input
            type="text"
            placeholder="Search squad by name, tag, or captain UID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none font-medium font-sans"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-xs text-gray-400 hover:text-white font-condensed uppercase font-bold px-1"
            >
              CLEAR
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'PRESENT', 'LATE', 'ABSENT', 'DISQUALIFIED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 text-[11px] font-condensed font-bold tactical-cut uppercase tracking-wider transition-colors shrink-0 ${
                filterStatus === status
                  ? 'bg-[#ffb60e] text-black font-black'
                  : 'text-gray-400 hover:text-white hover:bg-[#222222]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Attendance Table with 1-Click Status Controls */}
      <div className="bg-[#171716] border border-[#333333] tactical-cut overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#333333] text-gray-400 font-condensed uppercase font-bold text-xs bg-[#101010]">
                <th className="py-3 px-4">SQUAD NAME</th>
                <th className="py-3 px-4">GROUP</th>
                <th className="py-3 px-4">CURRENT STATUS</th>
                <th className="py-3 px-4">CHECKED-IN BY</th>
                <th className="py-3 px-4 text-right">QUICK ACTION (1-CLICK)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626] font-medium font-condensed">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 text-[#ffb60e] animate-spin" />
                      <span className="text-xs font-condensed uppercase font-bold text-gray-300">Loading lobby attendance records...</span>
                    </div>
                  </td>
                </tr>
              ) : !filteredRecords || filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <UserCheck className="w-8 h-8 text-gray-600 mb-1" />
                      <span className="font-teko uppercase text-base text-gray-300">
                        {search ? 'NO MATCHING SQUADS FOUND' : 'NO SQUADS ENROLLED'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {search
                          ? `No squads match the query "${search}". Try clearing the search.`
                          : 'Registered squads for this tournament will appear here for lobby check-in.'}
                      </span>
                      {search && (
                        <button
                          onClick={() => {
                            setSearch('');
                            setFilterStatus('ALL');
                          }}
                          className="mt-2 px-3 py-1 text-xs font-condensed uppercase font-bold bg-[#222222] hover:bg-[#2a2a2a] text-gray-300 border border-[#444444] tactical-cut"
                        >
                          CLEAR FILTERS
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.teamId} className="hover:bg-[#202020] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{record.teamName}</span>
                        <span className="text-[10px] text-[#ffb60e] font-condensed font-bold">
                          [{record.teamTag}]
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-bold text-gray-400">{record.group || '—'}</td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 tactical-cut text-[10px] font-black uppercase tracking-wider ${
                          record.status === 'PRESENT'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : record.status === 'LATE'
                            ? 'bg-[#ffb60e]/20 text-[#ffb60e] border border-[#ffb60e]/40'
                            : record.status === 'DISQUALIFIED'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        }`}
                      >
                        {record.status === 'PRESENT' && <CheckCircle className="w-3 h-3" />}
                        {record.status === 'LATE' && <Clock className="w-3 h-3" />}
                        {record.status === 'ABSENT' && <XCircle className="w-3 h-3" />}
                        {record.status === 'DISQUALIFIED' && <Ban className="w-3 h-3" />}
                        {record.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-xs text-gray-400">
                      {record.checkedInBy ? (
                        <span>
                          {record.checkedInBy}{' '}
                          {record.timestamp && (
                            <span className="text-gray-500 text-[10px]">
                              ({new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-600">Pending</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => markStatus(record.teamId, 'PRESENT')}
                          className={`px-2.5 py-1 tactical-cut text-[10px] font-bold uppercase transition-colors ${
                            record.status === 'PRESENT'
                              ? 'bg-emerald-500 text-black shadow-sm font-black'
                              : 'bg-[#222222] text-emerald-400 hover:bg-emerald-950/60 border border-emerald-500/40'
                          }`}
                        >
                          PRESENT
                        </button>

                        <button
                          onClick={() => markStatus(record.teamId, 'LATE')}
                          className={`px-2.5 py-1 tactical-cut text-[10px] font-bold uppercase transition-colors ${
                            record.status === 'LATE'
                              ? 'bg-[#ffb60e] text-black shadow-sm font-black'
                              : 'bg-[#222222] text-[#ffb60e] hover:bg-[#ffb60e]/20 border border-[#ffb60e]/40'
                          }`}
                        >
                          LATE
                        </button>

                        <button
                          onClick={() => markStatus(record.teamId, 'ABSENT')}
                          className={`px-2.5 py-1 tactical-cut text-[10px] font-bold uppercase transition-colors ${
                            record.status === 'ABSENT'
                              ? 'bg-rose-500 text-white shadow-sm font-black'
                              : 'bg-[#222222] text-rose-400 hover:bg-rose-950/60 border border-rose-500/40'
                          }`}
                        >
                          ABSENT
                        </button>

                        <button
                          onClick={() => markStatus(record.teamId, 'DISQUALIFIED')}
                          className={`px-2 py-1 tactical-cut text-[10px] font-bold uppercase transition-colors ${
                            record.status === 'DISQUALIFIED'
                              ? 'bg-purple-600 text-white shadow-sm font-black'
                              : 'bg-[#222222] text-purple-400 hover:bg-purple-950/60 border border-purple-500/40'
                          }`}
                          title="Disqualify Squad from Tournament"
                        >
                          DQ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
