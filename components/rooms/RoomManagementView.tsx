'use client';

import React, { useState, useEffect } from 'react';
import {
  DoorOpen,
  Copy,
  Check,
  Eye,
  EyeOff,
  Edit,
  Save,
  CheckCircle,
  Play,
  RotateCcw,
} from 'lucide-react';

export function RoomManagementView({ tournamentId }: { tournamentId: string }) {
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ roomId: string; password: string; status: string }>({
    roomId: '',
    password: '',
    status: '',
  });

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/matches`);
      const data = await res.json();
      if (data.success) {
        setMatches(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [tournamentId]);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const togglePasswordVisibility = (matchId: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [matchId]: !prev[matchId] }));
  };

  const handleEditClick = (match: any) => {
    setEditingRoomId(match.id);
    setEditForm({
      roomId: match.room?.roomId || '',
      password: match.room?.password || '',
      status: match.room?.status || 'READY',
    });
  };

  const handleSaveRoom = async (matchId: string) => {
    try {
      const res = await fetch(`/api/matches/${matchId}/room`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        setEditingRoomId(null);
        fetchRooms();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateRoomStatus = async (matchId: string, status: string) => {
    try {
      const res = await fetch(`/api/matches/${matchId}/room`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchRooms();
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
            <DoorOpen className="w-5 h-5 text-emerald-400" />
            BGMI Custom Room Operations Hub
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage lobby IDs, encrypted passwords, and custom room lifecycle states
          </p>
        </div>
      </div>

      {/* Room Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] bg-slate-950/60">
                <th className="py-3 px-4">Match / Map</th>
                <th className="py-3 px-4">Room Name</th>
                <th className="py-3 px-4">Room ID</th>
                <th className="py-3 px-4">Password</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {matches.map((match) => {
                const room = match.room;
                const isEditing = editingRoomId === match.id;
                const isPasswordVisible = visiblePasswords[match.id] || false;

                return (
                  <tr key={match.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-bold text-white">{match.title}</span>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {match.map} • {match.perspective} •{' '}
                          {new Date(match.scheduledStartTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-300">
                      {room?.roomName || 'Pending'}
                    </td>

                    <td className="py-3 px-4">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.roomId}
                          onChange={(e) => setEditForm({ ...editForm, roomId: e.target.value })}
                          placeholder="e.g. 8923011"
                          className="bg-slate-950 border border-slate-700 text-white rounded px-2 py-1 text-xs font-mono w-28"
                        />
                      ) : (
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="text-white font-bold">{room?.roomId || '—'}</span>
                          {room?.roomId && (
                            <button
                              onClick={() => copyText(room.roomId, `id-${match.id}`)}
                              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
                              title="Copy Room ID"
                            >
                              {copiedKey === `id-${match.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.password}
                          onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                          placeholder="Password"
                          className="bg-slate-950 border border-slate-700 text-white rounded px-2 py-1 text-xs font-mono w-28"
                        />
                      ) : (
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="text-amber-400 font-bold">
                            {room?.password
                              ? isPasswordVisible
                                ? room.password
                                : '••••••••'
                              : '—'}
                          </span>
                          {room?.password && (
                            <>
                              <button
                                onClick={() => togglePasswordVisibility(match.id)}
                                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
                                title={isPasswordVisible ? 'Hide Password' : 'Show Password'}
                              >
                                {isPasswordVisible ? (
                                  <EyeOff className="w-3.5 h-3.5" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => copyText(room.password, `pass-${match.id}`)}
                                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
                                title="Copy Password"
                              >
                                {copiedKey === `pass-${match.id}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {isEditing ? (
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                          className="bg-slate-950 border border-slate-700 text-white rounded px-2 py-1 text-xs"
                        >
                          <option value="NOT_CREATED">NOT_CREATED</option>
                          <option value="READY">READY</option>
                          <option value="OPEN">OPEN</option>
                          <option value="LIVE">LIVE</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="CLOSED">CLOSED</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            room?.status === 'LIVE'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                              : room?.status === 'OPEN'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                              : room?.status === 'COMPLETED' || room?.status === 'CLOSED'
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          }`}
                        >
                          {room?.status || 'NOT_CREATED'}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {isEditing ? (
                        <button
                          onClick={() => handleSaveRoom(match.id)}
                          className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded flex items-center gap-1 ml-auto"
                        >
                          <Save className="w-3.5 h-3.5" /> Save
                        </button>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          {room?.status !== 'OPEN' && room?.status !== 'LIVE' && room?.status !== 'CLOSED' && (
                            <button
                              onClick={() => updateRoomStatus(match.id, 'OPEN')}
                              className="px-2.5 py-1 text-[10px] font-bold uppercase bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                            >
                              Open Lobby
                            </button>
                          )}

                          {room?.status === 'OPEN' && (
                            <button
                              onClick={() => updateRoomStatus(match.id, 'LIVE')}
                              className="px-2.5 py-1 text-[10px] font-bold uppercase bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors"
                            >
                              Mark Live
                            </button>
                          )}

                          <button
                            onClick={() => handleEditClick(match)}
                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                            title="Edit Credentials"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
