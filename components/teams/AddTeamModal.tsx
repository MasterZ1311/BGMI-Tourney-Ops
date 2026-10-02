'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  PlusCircle,
  Trash2,
  Users,
  Shield,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  UserPlus,
} from 'lucide-react';

interface PlayerInput {
  name: string;
  ign: string;
  characterId: string;
  role: 'CAPTAIN' | 'ASSAULTER' | 'SNIPER' | 'SUPPORT' | 'IGL';
  isSubstitute: boolean;
}

const DEFAULT_PLAYERS: PlayerInput[] = [
  { name: '', ign: '', characterId: '', role: 'IGL', isSubstitute: false },
  { name: '', ign: '', characterId: '', role: 'ASSAULTER', isSubstitute: false },
  { name: '', ign: '', characterId: '', role: 'ASSAULTER', isSubstitute: false },
  { name: '', ign: '', characterId: '', role: 'SUPPORT', isSubstitute: false },
];

export function AddTeamModal({
  isOpen,
  onClose,
  tournamentId,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [groupId, setGroupId] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [captainPhone, setCaptainPhone] = useState('');
  const [captainEmail, setCaptainEmail] = useState('');
  const [players, setPlayers] = useState<PlayerInput[]>(DEFAULT_PLAYERS);

  const [groups, setGroups] = useState<any[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch groups when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsLoadingGroups(true);
      fetch(`/api/tournaments/${tournamentId}/groups`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data)) {
            setGroups(data.data);
          }
        })
        .catch((err) => console.error('Failed to fetch groups:', err))
        .finally(() => setIsLoadingGroups(false));
    }
  }, [isOpen, tournamentId]);

  if (!isOpen) return null;

  const handleResetForm = () => {
    setName('');
    setTag('');
    setLogoUrl('');
    setGroupId('');
    setCaptainName('');
    setCaptainPhone('');
    setCaptainEmail('');
    setPlayers(DEFAULT_PLAYERS);
    setError(null);
  };

  const handlePlayerChange = (index: number, field: keyof PlayerInput, value: any) => {
    setPlayers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddPlayer = () => {
    if (players.length >= 6) return;
    setPlayers((prev) => [
      ...prev,
      {
        name: '',
        ign: '',
        characterId: '',
        role: 'ASSAULTER',
        isSubstitute: prev.length >= 4,
      },
    ]);
  };

  const handleRemovePlayer = (index: number) => {
    if (players.length <= 1) return;
    setPlayers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFillSample = () => {
    setName('GodLike Esports');
    setTag('GODL');
    setCaptainName('Jonathan Amaral');
    setCaptainPhone('+91 98765 43210');
    setCaptainEmail('contact@godlike.in');
    setPlayers([
      { name: 'Jonathan Amaral', ign: 'JONATHAN', characterId: '5112233445', role: 'IGL', isSubstitute: false },
      { name: 'Neyoo', ign: 'NEYOO', characterId: '5122334455', role: 'ASSAULTER', isSubstitute: false },
      { name: 'Abhishek Choudhary', ign: 'ZGOD', characterId: '5133445566', role: 'SUPPORT', isSubstitute: false },
      { name: 'Punkk', ign: 'PUNKK', characterId: '5144556677', role: 'ASSAULTER', isSubstitute: false },
      { name: 'Kronten', ign: 'KRONTEN', characterId: '5155667788', role: 'SNIPER', isSubstitute: true },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic Validations
    if (!name.trim() || name.trim().length < 2) {
      setError('Squad name must be at least 2 characters long.');
      return;
    }

    if (!tag.trim() || tag.trim().length < 2 || tag.trim().length > 6) {
      setError('Squad tag must be between 2 and 6 characters (e.g. GODL, SOUL).');
      return;
    }

    // Filter filled players
    const filledPlayers = players.filter((p) => p.ign.trim() || p.characterId.trim());

    if (filledPlayers.length === 0) {
      setError('Please enter at least 1 player in the squad roster.');
      return;
    }

    // Validate each filled player
    const processedPlayers = [];
    const seenUids = new Set<string>();

    for (let i = 0; i < filledPlayers.length; i++) {
      const p = filledPlayers[i];
      const ign = p.ign.trim();
      const uid = p.characterId.trim();

      if (!ign) {
        setError(`Player ${i + 1} is missing an In-Game Name (IGN).`);
        return;
      }

      if (!uid || !/^\d{5,15}$/.test(uid)) {
        setError(
          `Player "${ign}" has invalid Character ID "${uid}". Character ID must be 5 to 15 digits (numeric).`
        );
        return;
      }

      if (seenUids.has(uid)) {
        setError(`Duplicate Character ID ${uid} entered within this roster.`);
        return;
      }
      seenUids.add(uid);

      processedPlayers.push({
        name: p.name.trim() || ign, // Fallback to IGN if real name is omitted
        ign,
        characterId: uid,
        role: p.role,
        isSubstitute: p.isSubstitute,
        isVerified: true,
      });
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: name.trim(),
        tag: tag.trim().toUpperCase(),
        logoUrl: logoUrl.trim() || null,
        groupId: groupId || null,
        captainName: captainName.trim() || (processedPlayers[0]?.ign ?? null),
        captainPhone: captainPhone.trim() || null,
        captainEmail: captainEmail.trim() || null,
        players: processedPlayers,
      };

      const res = await fetch(`/api/tournaments/${tournamentId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to create team.');
        return;
      }

      handleResetForm();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'A network error occurred while creating the squad.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="tactical-cut bg-[#121212] border border-[#ffb60e]/30 max-w-3xl w-full my-auto shadow-2xl shadow-black/90 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#2e2e2e] bg-[#161616] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 tactical-cut bg-[#ffb60e]/15 border border-[#ffb60e]/40 flex items-center justify-center text-[#ffb60e]">
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-heading font-black text-white tracking-wider uppercase flex items-center gap-2">
                MANUAL SQUAD REGISTRATION
                <span className="text-[10px] font-condensed bg-[#ffb60e]/20 text-[#ffb60e] px-2 py-0.5 border border-[#ffb60e]/40">
                  OFFICIAL ROSTER
                </span>
              </h3>
              <p className="text-[11px] text-gray-400 font-condensed uppercase tracking-wider">
                REGISTER TEAM INFORMATION & VERIFIED BGMI CHARACTER UIDS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFillSample}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-condensed uppercase font-bold text-[#ffb60e] bg-[#ffb60e]/10 hover:bg-[#ffb60e]/20 border border-[#ffb60e]/30 tactical-cut transition-colors"
              title="Populate with example pro squad data"
            >
              <Sparkles className="w-3 h-3 text-[#ffb60e]" />
              <span>Fill Example</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 tactical-cut transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3 tactical-cut bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 font-condensed font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Squad Profile */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#2e2e2e] pb-1.5">
              <span className="text-xs font-condensed font-black tracking-widest text-[#ffb60e] uppercase flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#ffb60e]" />
                1. SQUAD PROFILE & ASSIGNMENT
              </span>
              <span className="text-[10px] font-mono text-gray-400">* Required fields</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-condensed font-bold uppercase tracking-wider text-gray-300">
                  Squad Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. GodLike Esports, Team Soul"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#171716] border border-[#333333] text-white px-3 py-2 text-xs font-condensed font-bold uppercase focus:border-[#ffb60e] focus:outline-none tactical-cut"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-condensed font-bold uppercase tracking-wider text-gray-300">
                  Squad Tag (2-6 chars) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. GODL, SOUL"
                  maxLength={6}
                  value={tag}
                  onChange={(e) => setTag(e.target.value.toUpperCase())}
                  className="w-full bg-[#171716] border border-[#333333] text-white px-3 py-2 text-xs font-mono font-bold uppercase focus:border-[#ffb60e] focus:outline-none tactical-cut text-center tracking-widest"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-condensed font-bold uppercase tracking-wider text-gray-300">
                  Group Allocation
                </label>
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="w-full bg-[#171716] border border-[#333333] text-white px-3 py-2 text-xs font-condensed font-bold uppercase focus:border-[#ffb60e] focus:outline-none tactical-cut"
                >
                  <option value="">-- UNALLOCATED (ALLOCATE LATER) --</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g._count?.teams ?? g.teams?.length ?? 0} squads)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-condensed font-bold uppercase tracking-wider text-gray-300">
                  Squad Logo URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full bg-[#171716] border border-[#333333] text-white px-3 py-2 text-xs font-mono focus:border-[#ffb60e] focus:outline-none tactical-cut"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact Details */}
          <div className="space-y-3">
            <div className="border-b border-[#2e2e2e] pb-1.5">
              <span className="text-xs font-condensed font-black tracking-widest text-[#ffb60e] uppercase flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#ffb60e]" />
                2. CAPTAIN / SQUAD MANAGER CONTACT (OPTIONAL)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-condensed font-bold uppercase tracking-wider text-gray-300">
                  Captain / Manager Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jonathan Amaral"
                  value={captainName}
                  onChange={(e) => setCaptainName(e.target.value)}
                  className="w-full bg-[#171716] border border-[#333333] text-white px-3 py-2 text-xs font-condensed font-bold focus:border-[#ffb60e] focus:outline-none tactical-cut"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-condensed font-bold uppercase tracking-wider text-gray-300">
                  Contact Phone / WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={captainPhone}
                  onChange={(e) => setCaptainPhone(e.target.value)}
                  className="w-full bg-[#171716] border border-[#333333] text-white px-3 py-2 text-xs font-mono focus:border-[#ffb60e] focus:outline-none tactical-cut"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-condensed font-bold uppercase tracking-wider text-gray-300">
                  Contact Email
                </label>
                <input
                  type="email"
                  placeholder="captain@esports.com"
                  value={captainEmail}
                  onChange={(e) => setCaptainEmail(e.target.value)}
                  className="w-full bg-[#171716] border border-[#333333] text-white px-3 py-2 text-xs font-mono focus:border-[#ffb60e] focus:outline-none tactical-cut"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Player Roster & UIDs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#2e2e2e] pb-1.5">
              <span className="text-xs font-condensed font-black tracking-widest text-[#ffb60e] uppercase flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#ffb60e]" />
                3. SQUAD ROSTER & BGMI CHARACTER UIDS ({players.length}/6 SLOTS)
              </span>

              {players.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddPlayer}
                  className="flex items-center gap-1 text-[11px] font-condensed uppercase font-bold text-[#ffb60e] hover:text-[#ffc83b] transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Add Player / Substitute</span>
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {players.map((p, idx) => (
                <div
                  key={idx}
                  className={`p-3 tactical-cut border transition-colors ${
                    p.isSubstitute
                      ? 'bg-[#141413] border-[#ffb60e]/30'
                      : 'bg-[#171716] border-[#333333]'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-condensed font-black text-gray-400">
                        SLOT #{idx + 1}
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 tactical-cut uppercase ${
                          p.isSubstitute
                            ? 'bg-[#ffb60e]/20 text-[#ffb60e] border border-[#ffb60e]/40'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {p.isSubstitute ? 'SUBSTITUTE (BENCH)' : 'ACTIVE STARTER'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-condensed uppercase text-gray-400 hover:text-white">
                        <input
                          type="checkbox"
                          checked={p.isSubstitute}
                          onChange={(e) =>
                            handlePlayerChange(idx, 'isSubstitute', e.target.checked)
                          }
                          className="accent-[#ffb60e] rounded-none w-3 h-3"
                        />
                        <span>Bench Sub</span>
                      </label>

                      {players.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePlayer(idx)}
                          className="text-gray-500 hover:text-rose-400 p-1 transition-colors"
                          title="Remove player"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="text-[10px] font-condensed font-bold uppercase text-gray-400">
                        In-Game Name (IGN) *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. JONATHAN"
                        value={p.ign}
                        onChange={(e) => handlePlayerChange(idx, 'ign', e.target.value)}
                        className="w-full bg-[#101010] border border-[#333333] text-white px-2.5 py-1.5 text-xs font-mono font-bold focus:border-[#ffb60e] focus:outline-none tactical-cut uppercase"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-condensed font-bold uppercase text-gray-400">
                        Character ID (UID) *
                      </label>
                      <input
                        type="text"
                        placeholder="5123456789"
                        value={p.characterId}
                        onChange={(e) =>
                          handlePlayerChange(
                            idx,
                            'characterId',
                            e.target.value.replace(/\D/g, '').slice(0, 15)
                          )
                        }
                        className="w-full bg-[#101010] border border-[#333333] text-[#ffb60e] px-2.5 py-1.5 text-xs font-mono font-bold focus:border-[#ffb60e] focus:outline-none tactical-cut"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-condensed font-bold uppercase text-gray-400">
                        Real Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Real Name"
                        value={p.name}
                        onChange={(e) => handlePlayerChange(idx, 'name', e.target.value)}
                        className="w-full bg-[#101010] border border-[#333333] text-gray-300 px-2.5 py-1.5 text-xs font-sans focus:border-[#ffb60e] focus:outline-none tactical-cut"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-condensed font-bold uppercase text-gray-400">
                        Tactical Role
                      </label>
                      <select
                        value={p.role}
                        onChange={(e) => handlePlayerChange(idx, 'role', e.target.value)}
                        className="w-full bg-[#101010] border border-[#333333] text-gray-200 px-2.5 py-1.5 text-xs font-condensed font-bold uppercase focus:border-[#ffb60e] focus:outline-none tactical-cut"
                      >
                        <option value="ASSAULTER">ASSAULTER</option>
                        <option value="IGL">IGL (IN-GAME LEADER)</option>
                        <option value="SNIPER">SNIPER</option>
                        <option value="SUPPORT">SUPPORT</option>
                        <option value="CAPTAIN">CAPTAIN</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-[#2e2e2e] flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-condensed uppercase font-bold text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="tactical-btn-gold px-6 py-2 text-xs flex items-center gap-1.5 shadow-xl shadow-[#ffb60e]/20 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4 stroke-[2.5]" />
                <span>{isSubmitting ? 'REGISTERING SQUAD...' : 'REGISTER SQUAD'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
