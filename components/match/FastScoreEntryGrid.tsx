'use client';

import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Save,
  Send,
  CheckCircle,
  Globe,
  AlertTriangle,
  RotateCcw,
  Trophy,
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
  matchId,
  onScoresSaved,
}: {
  tournamentId: string;
  matchId: string;
  onScoresSaved?: () => void;
}) {
  const [match, setMatch] = useState<any | null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [scoringRule, setScoringRule] = useState<ScoringRuleConfig>(BGIS_10_POINT_SYSTEM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Load match details, scoring rule, and teams
    const loadData = async () => {
      try {
        const [matchRes, teamsRes, tourRes] = await Promise.all([
          fetch(`/api/matches/${matchId}`).then((r) => r.json()),
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
      } catch (err) {
        console.error(err);
      }
    };

    loadData();
  }, [matchId, tournamentId]);

  const updateRow = (index: number, field: keyof ScoreRow, value: any) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSave = async (status: 'DRAFT' | 'SUBMITTED') => {
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
      const res = await fetch(`/api/matches/${matchId}/results`, {
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

      if (onScoresSaved) onScoresSaved();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async () => {
    try {
      const res = await fetch(`/api/matches/${matchId}/verify`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Match scores verified by Tournament Admin!' });
        if (onScoresSaved) onScoresSaved();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handlePublish = async () => {
    try {
      const res = await fetch(`/api/matches/${matchId}/publish`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMessage({
          type: 'success',
          text: 'Match scores PUBLISHED to official tournament leaderboard!',
        });
        if (onScoresSaved) onScoresSaved();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Verification Workflow */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">
              Score Entry Grid: {match?.title || 'Match'}
            </h2>
            <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {match?.resultStatus || 'DRAFT'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Rule: <strong className="text-emerald-400">{scoringRule.name}</strong> • 16-row rapid keyboard entry
          </p>
        </div>

        {/* 4-Tier Verification Workflow Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleSave('DRAFT')}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
          >
            <Save className="w-3.5 h-3.5" />
            Save Draft
          </button>

          <button
            onClick={() => handleSave('SUBMITTED')}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            Submit
          </button>

          <button
            onClick={handleVerify}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-lg shadow-sm transition-all"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Verify
          </button>

          <button
            onClick={handlePublish}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-md shadow-emerald-600/30 transition-all"
          >
            <Globe className="w-3.5 h-3.5" />
            Publish
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold ${
            message.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 16-Row High Speed Entry Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] bg-slate-950/80">
                <th className="py-2.5 px-3 text-center w-14">Rank</th>
                <th className="py-2.5 px-3 w-56">Squad Selection</th>
                <th className="py-2.5 px-3 text-center w-20">Kills</th>
                <th className="py-2.5 px-3 text-center w-24">Placement Pts</th>
                <th className="py-2.5 px-3 text-center w-20">Kill Pts</th>
                <th className="py-2.5 px-3 text-center w-20">Bonus</th>
                <th className="py-2.5 px-3 text-center w-20">Penalty</th>
                <th className="py-2.5 px-3 text-right w-24 font-bold text-white">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {rows.map((row, idx) => {
                const calc = calculateSingleTeamScore(row, scoringRule);
                const isWinner = row.placement === 1;

                return (
                  <tr
                    key={row.placement}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isWinner ? 'bg-emerald-950/20 font-bold' : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-2 px-3 text-center font-mono font-bold">
                      {isWinner ? (
                        <span className="inline-flex items-center gap-1 text-amber-400">
                          🍗 #1
                        </span>
                      ) : (
                        <span className="text-slate-400">#{row.placement}</span>
                      )}
                    </td>

                    {/* Team Selection */}
                    <td className="py-2 px-3">
                      <select
                        value={row.teamId}
                        onChange={(e) => updateRow(idx, 'teamId', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 text-white rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="">-- Select Squad --</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} [{t.tag}]
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Kills input */}
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={row.kills}
                        onChange={(e) => updateRow(idx, 'kills', parseInt(e.target.value) || 0)}
                        className="w-16 bg-slate-950 border border-slate-700 text-white text-center rounded px-1.5 py-1 font-mono text-xs focus:ring-1 focus:ring-emerald-500"
                      />
                    </td>

                    {/* Auto-calculated Placement Points */}
                    <td className="py-2 px-3 text-center font-mono text-slate-300 font-bold">
                      {calc.placementPoints}
                    </td>

                    {/* Auto-calculated Kill Points */}
                    <td className="py-2 px-3 text-center font-mono text-emerald-400">
                      {calc.killPoints}
                    </td>

                    {/* Bonus */}
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={row.bonusPoints}
                        onChange={(e) => updateRow(idx, 'bonusPoints', parseFloat(e.target.value) || 0)}
                        className="w-14 bg-slate-950 border border-slate-700 text-slate-300 text-center rounded px-1 py-1 font-mono text-xs"
                      />
                    </td>

                    {/* Penalty */}
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={row.penaltyPoints}
                        onChange={(e) => updateRow(idx, 'penaltyPoints', parseFloat(e.target.value) || 0)}
                        className="w-14 bg-slate-950 border border-slate-700 text-rose-400 text-center rounded px-1 py-1 font-mono text-xs"
                      />
                    </td>

                    {/* Live Total */}
                    <td className="py-2 px-3 text-right font-black font-mono text-sm text-emerald-400">
                      {calc.totalPoints}
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
