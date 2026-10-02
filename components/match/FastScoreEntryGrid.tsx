'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calculator,
  Save,
  Send,
  CheckCircle,
  Globe,
  AlertTriangle,
  RotateCcw,
  Trophy,
  Loader2,
  Keyboard,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { calculateSingleTeamScore } from '@/lib/scoring/engine';
import { BGIS_10_POINT_SYSTEM } from '@/lib/scoring/presets';
import { ScoringRuleConfig } from '@/lib/scoring/types';

interface ScoreRow {
  teamId: string;
  placement: number;
  kills: number;
  bonusPoints: number;
  penaltyPoints: number;
  notes?: string;
}

export function FastScoreEntryGrid({
  tournamentId,
  matchId: propMatchId,
  onScoresSaved,
  onNavigateTab,
}: {
  tournamentId: string;
  matchId?: string;
  onScoresSaved?: () => void;
  onNavigateTab?: (tab: any) => void;
}) {
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>(propMatchId || '');
  const [match, setMatch] = useState<any | null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [scoringRule, setScoringRule] = useState<ScoringRuleConfig>(BGIS_10_POINT_SYSTEM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Fetch Tournament Matches
  const fetchMatchesList = async () => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/matches`);
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        setMatches(data.data);
        const matchValid = data.data.some((m: any) => m.id === selectedMatchId);
        if (!selectedMatchId || !matchValid) {
          const live = data.data.find((m: any) => m.status === 'LIVE');
          const ready = data.data.find((m: any) => m.status === 'READY' || m.status === 'OPEN');
          const defaultMatch = live || ready || data.data[0];
          setSelectedMatchId(defaultMatch.id);
        }
      } else {
        setMatches([]);
        setSelectedMatchId('');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Failed to load tournament matches for score entry:', err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchesList();
  }, [tournamentId]);

  useEffect(() => {
    if (propMatchId) {
      setSelectedMatchId(propMatchId);
    }
  }, [propMatchId]);

  // 2. Load Match Details, Scoring Rule, and Teams for the selected match
  useEffect(() => {
    if (!selectedMatchId) {
      if (matches.length === 0) setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      setMessage(null);
      try {
        const [matchRes, teamsRes, tourRes] = await Promise.all([
          fetch(`/api/matches/${selectedMatchId}`).then((r) => r.json()),
          fetch(`/api/tournaments/${tournamentId}/teams`).then((r) => r.json()),
          fetch(`/api/tournaments/${tournamentId}`).then((r) => r.json()),
        ]);

        if (matchRes.success) setMatch(matchRes.data);
        if (teamsRes.success) setTeams(teamsRes.data);

        let rule = BGIS_10_POINT_SYSTEM;
        if (tourRes.success && tourRes.data?.scoringRule) {
          try {
            rule = {
              name: tourRes.data.scoringRule.name,
              placementPoints: JSON.parse(tourRes.data.scoringRule.placementPoints),
              killPointsPerElim: tourRes.data.scoringRule.killPointsPerElim,
              wwcdBonus: tourRes.data.scoringRule.wwcdBonus,
              tieBreakers: JSON.parse(tourRes.data.scoringRule.tieBreakers),
            };
            setScoringRule(rule);
          } catch (e) {
            console.error(e);
          }
        }

        // Initialize 16 rows
        if (matchRes.data?.scores && matchRes.data.scores.length > 0) {
          // Preload existing scores
          const sorted = [...matchRes.data.scores].sort((a, b) => a.placement - b.placement);
          setRows(
            sorted.map((s) => ({
              teamId: s.teamId,
              placement: s.placement,
              kills: s.kills,
              bonusPoints: s.bonusPoints || 0,
              penaltyPoints: s.penaltyPoints || 0,
              notes: s.notes || '',
            }))
          );
        } else {
          // Blank 16 rows
          const initialRows: ScoreRow[] = [];
          for (let rank = 1; rank <= 16; rank++) {
            const team = teamsRes.data?.[rank - 1];
            initialRows.push({
              teamId: team?.id || '',
              placement: rank,
              kills: 0,
              bonusPoints: 0,
              penaltyPoints: 0,
              notes: '',
            });
          }
          setRows(initialRows);
        }
      } catch (err: any) {
        console.error(err);
        setMessage({ type: 'error', text: 'Failed to load match scores and squads.' });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedMatchId, tournamentId]);

  // Global Ctrl+S / Cmd+S quick save draft
  useEffect(() => {
    const handleGlobalSave = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave('DRAFT');
      }
    };
    window.addEventListener('keydown', handleGlobalSave);
    return () => window.removeEventListener('keydown', handleGlobalSave);
  }, [rows, selectedMatchId]);

  // Arrow up/down keyboard navigation between rows
  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    rowIndex: number,
    colField: string
  ) => {
    if (e.key === 'ArrowDown' || (e.key === 'Enter' && !e.shiftKey)) {
      e.preventDefault();
      const nextInput = document.querySelector<HTMLElement>(`[data-cell="${colField}-${rowIndex + 1}"]`);
      if (nextInput) nextInput.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevInput = document.querySelector<HTMLElement>(`[data-cell="${colField}-${rowIndex - 1}"]`);
      if (prevInput) prevInput.focus();
    }
  };

  // Real-time duplicates calculation
  const teamCounts = rows.reduce<Record<string, number>>((acc, r) => {
    if (r.teamId) acc[r.teamId] = (acc[r.teamId] || 0) + 1;
    return acc;
  }, {});
  const placementCounts = rows.reduce<Record<number, number>>((acc, r) => {
    if (r.placement) acc[r.placement] = (acc[r.placement] || 0) + 1;
    return acc;
  }, {});
  const hasDuplicateTeams = Object.values(teamCounts).some((c) => c > 1);
  const hasDuplicatePlacements = Object.values(placementCounts).some((c) => c > 1);

  const updateRow = (index: number, field: keyof ScoreRow, value: any) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSave = async (status: 'DRAFT' | 'SUBMITTED') => {
    if (!selectedMatchId) return;
    setIsSubmitting(true);
    setMessage(null);

    // Validation
    const seenTeams = new Set<string>();
    const seenPlacements = new Set<number>();
    for (const r of rows) {
      if (!r.teamId) {
        setMessage({ type: 'error', text: `Row #${r.placement} has no team selected.` });
        setIsSubmitting(false);
        return;
      }
      if (seenTeams.has(r.teamId)) {
        setMessage({ type: 'error', text: 'Duplicate team selection detected.' });
        setIsSubmitting(false);
        return;
      }
      seenTeams.add(r.teamId);

      if (seenPlacements.has(r.placement)) {
        setMessage({ type: 'error', text: `Duplicate placement rank #${r.placement} entered.` });
        setIsSubmitting(false);
        return;
      }
      seenPlacements.add(r.placement);
    }

    try {
      const res = await fetch(`/api/matches/${selectedMatchId}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resultStatus: status,
          scores: rows,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to save results');
      }

      setMessage({
        type: 'success',
        text: `Match results successfully saved as ${status}!`,
      });

      fetchMatchesList();
      if (onScoresSaved) onScoresSaved();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (!selectedMatchId) return;
    try {
      const res = await fetch(`/api/matches/${selectedMatchId}/verify`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Match scores verified by Tournament Admin!' });
        fetchMatchesList();
        if (onScoresSaved) onScoresSaved();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handlePublish = async () => {
    if (!selectedMatchId) return;
    try {
      const res = await fetch(`/api/matches/${selectedMatchId}/publish`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMessage({
          type: 'success',
          text: 'Match scores PUBLISHED to official tournament leaderboard!',
        });
        fetchMatchesList();
        if (onScoresSaved) onScoresSaved();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  // Empty State: When no matches are scheduled yet
  if (!isLoading && matches.length === 0) {
    return (
      <div className="bg-[#171716] border border-dashed border-[#333333] tactical-cut p-10 text-center max-w-xl mx-auto my-12 space-y-4 shadow-2xl">
        <div className="w-14 h-14 bg-[#ffb60e]/10 border border-[#ffb60e]/30 flex items-center justify-center text-[#ffb60e] mx-auto tactical-cut">
          <Calculator className="w-7 h-7 text-[#ffb60e]" />
        </div>
        <div>
          <h3 className="text-2xl font-teko uppercase font-bold text-white tracking-wider">
            NO MATCH FIXTURES SCHEDULED FOR SCORE ENTRY
          </h3>
          <p className="text-xs text-gray-400 font-sans max-w-md mx-auto mt-1 leading-relaxed">
            Tournament fixtures must be generated before match placements, eliminations, and WWCDs can be entered. Navigate to the Schedule tab to generate your tournament fixtures.
          </p>
        </div>
        {onNavigateTab ? (
          <button
            onClick={() => onNavigateTab('schedule')}
            className="tactical-btn-gold px-6 py-2.5 text-xs uppercase tracking-wider font-heading font-black inline-flex items-center gap-2"
          >
            <Calendar className="w-4 h-4 text-black" />
            <span>GO TO MATCH SCHEDULE</span>
          </button>
        ) : (
          <Link
            href={`/tournaments/${tournamentId}?tab=schedule`}
            className="tactical-btn-gold px-6 py-2.5 text-xs uppercase tracking-wider font-heading font-black inline-flex items-center gap-2"
          >
            <Calendar className="w-4 h-4 text-black" />
            <span>GO TO MATCH SCHEDULE</span>
          </Link>
        )}
      </div>
    );
  }

  // Initial loading spinner
  if (isLoading && !match) {
    return (
      <div className="bg-[#171716] border border-[#333333] tactical-cut p-16 text-center text-gray-400 my-8">
        <div className="flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-[#ffb60e] animate-spin" />
          <span className="text-xs font-condensed uppercase font-bold text-gray-300 tracking-wider">
            Loading match score sheet & tournament rosters...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Match Selector Bar */}
      {matches.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#171716] border border-[#333333] p-3 tactical-cut">
          <div className="flex items-center gap-2">
            <span className="text-xs font-condensed font-bold uppercase tracking-wider text-gray-400">
              SELECT MATCH:
            </span>
            <select
              value={selectedMatchId}
              onChange={(e) => setSelectedMatchId(e.target.value)}
              className="bg-[#101010] border border-[#333333] text-white text-xs font-condensed font-bold uppercase tracking-wider px-3 py-1.5 tactical-cut focus:border-[#ffb60e] outline-none"
            >
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  Match #{m.matchNumber}: {m.title} ({m.map}) — [{m.resultStatus || m.status}]
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {matches.map((m) => {
              const isSelected = m.id === selectedMatchId;
              const isLive = m.status === 'LIVE';
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMatchId(m.id)}
                  className={`px-3 py-1 text-xs font-condensed uppercase font-bold tracking-wider tactical-cut transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#ffb60e] text-black font-black shadow-md'
                      : isLive
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                      : 'bg-[#222222] text-gray-300 hover:text-white hover:bg-[#2a2a2a] border border-[#333333]'
                  }`}
                >
                  #{m.matchNumber} {m.map}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Header and Verification Workflow */}
      <div className="hud-frame relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 tactical-cut bg-[#171716] border border-[#333333] shadow-xl">
        {/* Dynamic Map Background Artwork */}
        {match?.map && (
          <div className="absolute inset-0 pointer-events-none opacity-30 overflow-hidden">
            <img
              src={`/images/maps/${(match?.map || 'erangel').toLowerCase()}.jpg`}
              alt=""
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#171716] via-[#171716]/80 to-transparent" />
          </div>
        )}

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#ffb60e]" />
            <h2 className="text-2xl font-teko uppercase font-bold tracking-wider text-white leading-none">
              SCORE ENTRY GRID: {match?.title || 'MATCH'}
            </h2>
            <span className="text-[10px] uppercase font-condensed font-black px-2 py-0.5 tactical-cut bg-[#ffb60e]/15 text-[#ffb60e] border border-[#ffb60e]/40">
              {match?.resultStatus || 'DRAFT'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1 font-condensed uppercase tracking-wider">
            RULE: <strong className="text-[#ffb60e]">{scoringRule.name}</strong> • 16-ROW RAPID KEYBOARD ENTRY
          </p>
        </div>

        {/* 4-Tier Verification Workflow Buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleSave('DRAFT')}
            disabled={isSubmitting || isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-condensed uppercase font-bold tracking-wider bg-[#222222] hover:bg-[#2a2a2a] text-gray-300 tactical-cut border border-[#444444] disabled:opacity-50 transition-colors"
            title="Save as Draft (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5 text-gray-400" />
            SAVE DRAFT
          </button>

          <button
            onClick={() => handleSave('SUBMITTED')}
            disabled={isSubmitting || isLoading || hasDuplicateTeams || hasDuplicatePlacements}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-condensed uppercase font-bold tracking-wider bg-blue-700 hover:bg-blue-600 text-white tactical-cut shadow-sm transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            SUBMIT
          </button>

          <button
            onClick={handleVerify}
            disabled={isSubmitting || isLoading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-condensed uppercase font-bold tracking-wider bg-amber-600 hover:bg-amber-500 text-white tactical-cut shadow-sm transition-all disabled:opacity-50"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            VERIFY
          </button>

          <button
            onClick={handlePublish}
            disabled={isSubmitting || isLoading}
            className="tactical-btn-gold px-4 py-2 text-xs flex items-center gap-1.5 shadow-md shadow-[#ffb60e]/20 disabled:opacity-50"
          >
            <Globe className="w-4 h-4 text-black stroke-[2.5]" />
            <span>PUBLISH LEADERBOARD</span>
          </button>
        </div>
      </div>

      {/* Workflow Step Visualizer */}
      <div className="flex items-center gap-2 p-2.5 tactical-cut bg-[#171716] border border-[#333333] text-[11px] font-condensed uppercase tracking-wider overflow-x-auto">
        <span className="text-gray-500 font-bold px-1 text-[10px]">PIPELINE STATUS:</span>
        {[
          { key: 'DRAFT', label: '1. DRAFT' },
          { key: 'SUBMITTED', label: '2. SUBMITTED' },
          { key: 'VERIFIED', label: '3. VERIFIED' },
          { key: 'PUBLISHED', label: '4. PUBLISHED' },
        ].map((s, idx) => {
          const isActive = match?.resultStatus === s.key;
          return (
            <div key={s.key} className="flex items-center gap-1.5">
              <span
                className={`px-2.5 py-0.5 tactical-cut font-bold text-xs ${
                  isActive
                    ? 'bg-[#ffb60e] text-black font-black'
                    : 'bg-[#101010] text-gray-500 border border-[#2e2e2e]'
                }`}
              >
                {s.label}
              </span>
              {idx < 3 && <ArrowRight className="w-3 h-3 text-gray-600" />}
            </div>
          );
        })}
        <div className="ml-auto hidden md:flex items-center gap-2 text-[10px] text-gray-500 font-condensed uppercase font-bold">
          <Keyboard className="w-3.5 h-3.5 text-gray-400" />
          <span>CTRL+S SAVE • ↑/↓/ENTER ROW HOP</span>
        </div>
      </div>

      {/* Instant Duplicate Warning Banner */}
      {(hasDuplicateTeams || hasDuplicatePlacements) && (
        <div className="p-3 tactical-cut bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 flex items-center justify-between shadow-lg animate-pulse font-condensed font-bold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              {hasDuplicateTeams && hasDuplicatePlacements
                ? 'Duplicate squads and duplicate placement ranks detected! Each row must be unique.'
                : hasDuplicateTeams
                ? 'Duplicate squad selection detected! The same squad cannot occupy multiple placement slots.'
                : 'Duplicate placement ranks entered! Each squad must have a unique rank (1 to 16).'}
            </span>
          </div>
          <span className="text-[10px] font-condensed font-black uppercase bg-rose-500/30 text-rose-200 px-2 py-0.5 tactical-cut">
            DUPLICATE ALERT
          </span>
        </div>
      )}

      {message && (
        <div
          className={`p-3 tactical-cut text-xs font-condensed font-bold uppercase tracking-wide ${
            message.type === 'success'
              ? 'bg-[#ffb60e]/15 text-[#ffb60e] border border-[#ffb60e]/40'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 16-Row High Speed Entry Table */}
      {teams.length === 0 ? (
        <div className="bg-[#171716] border border-dashed border-[#333333] tactical-cut p-10 text-center text-gray-400">
          <Trophy className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <h4 className="text-base font-teko uppercase font-bold text-gray-300">NO SQUADS ENROLLED</h4>
          <p className="text-xs font-condensed uppercase text-gray-500 mt-1">
            Teams must be registered before scores can be submitted. Please register teams in the Teams tab.
          </p>
        </div>
      ) : (
        <div className="bg-[#171716] border border-[#333333] tactical-cut overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#333333] text-gray-400 font-condensed uppercase font-bold text-xs bg-[#101010]">
                  <th className="py-2.5 px-3 text-center w-14">RANK</th>
                  <th className="py-2.5 px-3 w-56">SQUAD SELECTION</th>
                  <th className="py-2.5 px-3 text-center w-20">KILLS</th>
                  <th className="py-2.5 px-3 text-center w-24">PLACEMENT PTS</th>
                  <th className="py-2.5 px-3 text-center w-20">KILL PTS</th>
                  <th className="py-2.5 px-3 text-center w-20">BONUS</th>
                  <th className="py-2.5 px-3 text-center w-20">PENALTY</th>
                  <th className="py-2.5 px-3 text-right w-24 font-bold text-white">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626] font-medium font-condensed">
                {rows.map((row, idx) => {
                  const calc = calculateSingleTeamScore(row, scoringRule);
                  const isWinner = row.placement === 1;
                  const isDupTeam = !!(row.teamId && teamCounts[row.teamId] > 1);
                  const isDupPlacement = placementCounts[row.placement] > 1;

                  return (
                    <tr
                      key={row.placement}
                      className={`hover:bg-[#202020] transition-colors ${
                        isDupTeam || isDupPlacement
                          ? 'bg-rose-950/20 border-l-4 border-rose-500'
                          : isWinner
                          ? 'bg-[#ffb60e]/10 font-bold border-l-4 border-l-[#ffb60e]'
                          : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-2 px-3 text-center font-teko text-base font-bold">
                        {isWinner ? (
                          <span className="inline-flex items-center gap-1 text-[#ffb60e] text-lg font-black">
                            🍗 WWCD #1
                          </span>
                        ) : (
                          <span className={isDupPlacement ? 'text-rose-400 font-black' : 'text-gray-400'}>
                            #{row.placement}
                          </span>
                        )}
                      </td>

                      {/* Team Selection */}
                      <td className="py-2 px-3">
                        <select
                          data-cell={`teamId-${idx}`}
                          value={row.teamId}
                          onChange={(e) => updateRow(idx, 'teamId', e.target.value)}
                          onKeyDown={(e) => handleCellKeyDown(e, idx, 'teamId')}
                          className={`w-full bg-[#121212] border text-white px-2.5 py-1 text-xs focus:border-[#ffb60e] focus:outline-none font-condensed font-bold uppercase ${
                            isDupTeam ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-[#333333]'
                          }`}
                        >
                          <option value="">-- SELECT SQUAD --</option>
                          {teams.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} [{t.tag}]
                            </option>
                          ))}
                        </select>
                        {isDupTeam && (
                          <span className="text-[10px] text-rose-400 font-condensed font-bold block mt-0.5">
                            ⚠️ Duplicate Squad
                          </span>
                        )}
                      </td>

                      {/* Kills input */}
                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="60"
                          data-cell={`kills-${idx}`}
                          value={row.kills}
                          onChange={(e) => updateRow(idx, 'kills', parseInt(e.target.value) || 0)}
                          onKeyDown={(e) => handleCellKeyDown(e, idx, 'kills')}
                          className="w-16 bg-[#121212] border border-[#333333] text-white text-center px-1.5 py-1 font-condensed font-bold text-xs focus:border-[#ffb60e] focus:outline-none"
                        />
                      </td>

                      {/* Auto-calculated Placement Points */}
                      <td className="py-2 px-3 text-center font-condensed text-gray-200 font-bold text-sm">
                        {calc.placementPoints}
                      </td>

                      {/* Auto-calculated Kill Points */}
                      <td className="py-2 px-3 text-center font-condensed text-[#ffb60e] font-bold text-sm">
                        {calc.killPoints}
                      </td>

                      {/* Bonus */}
                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          data-cell={`bonusPoints-${idx}`}
                          value={row.bonusPoints}
                          onChange={(e) => updateRow(idx, 'bonusPoints', parseFloat(e.target.value) || 0)}
                          onKeyDown={(e) => handleCellKeyDown(e, idx, 'bonusPoints')}
                          className="w-14 bg-[#121212] border border-[#333333] text-gray-300 text-center px-1 py-1 font-condensed text-xs focus:border-[#ffb60e] focus:outline-none"
                        />
                      </td>

                      {/* Penalty */}
                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          data-cell={`penaltyPoints-${idx}`}
                          value={row.penaltyPoints}
                          onChange={(e) => updateRow(idx, 'penaltyPoints', parseFloat(e.target.value) || 0)}
                          onKeyDown={(e) => handleCellKeyDown(e, idx, 'penaltyPoints')}
                          className="w-14 bg-[#121212] border border-[#333333] text-rose-400 text-center px-1 py-1 font-condensed text-xs focus:border-[#ffb60e] focus:outline-none"
                        />
                      </td>

                      {/* Live Total */}
                      <td className="py-2 px-3 text-right font-black font-condensed text-base text-[#ffb60e]">
                        {calc.totalPoints}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
