'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Settings,
  Users,
  Calendar,
  Calculator,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import { SCORING_PRESETS } from '@/lib/scoring/presets';

export function TournamentWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    // Step 1: Info
    name: 'BGMI Championship 2026',
    organizer: 'Esports India Guild',
    description: 'Premier Battle Royale tournament for grassroots and competitive BGMI squads.',
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    venue: 'Online Custom Rooms',
    contactEmail: 'tournaments@esportsguild.in',

    // Step 2: Format
    format: 'GROUP_STAGE',

    // Step 3: Team Config
    totalTeamsCap: 32,
    squadSize: 4,
    substitutesCap: 2,
    maxTeamsPerGroup: 16,

    // Step 4: Match Config
    matchCount: 6,
    maps: ['ERANGEL', 'MIRAMAR', 'SANHOK', 'VIKENDI'],
    matchDurationMinutes: 30,
    breakDurationMinutes: 15,

    // Step 5: Scoring Config
    scoringPreset: 'BGIS_10',
    killPointsPerElim: 1.0,
    wwcdBonus: 0.0,

    // Step 6: Rules
    noShowGraceMinutes: 10,
    disputeWindowMinutes: 15,
    allowSubstitutions: true,
    emulatorPolicy: 'STRICTLY_BANNED',
  });

  const steps = [
    { num: 1, title: 'Basic Info', icon: Trophy },
    { num: 2, title: 'Format', icon: Settings },
    { num: 3, title: 'Squad Limits', icon: Users },
    { num: 4, title: 'Matches', icon: Calendar },
    { num: 5, title: 'Scoring Rules', icon: Calculator },
    { num: 6, title: 'Rulebook', icon: ShieldCheck },
    { num: 7, title: 'Review & Launch', icon: FileCheck },
  ];

  const handleNext = () => {
    setError(null);
    if (step === 1 && !formData.name.trim()) {
      setError('Please provide a tournament name.');
      return;
    }
    setStep((prev) => Math.min(prev + 1, 7));
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    const presetConfig = SCORING_PRESETS[formData.scoringPreset] || SCORING_PRESETS.BGIS_10;

    const payload = {
      name: formData.name,
      organizer: formData.organizer,
      description: formData.description,
      format: formData.format,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      venue: formData.venue,
      contactEmail: formData.contactEmail,
      settings: {
        totalTeamsCap: Number(formData.totalTeamsCap),
        squadSize: Number(formData.squadSize),
        substitutesCap: Number(formData.substitutesCap),
        maxTeamsPerGroup: Number(formData.maxTeamsPerGroup),
        matchDurationMinutes: Number(formData.matchDurationMinutes),
        breakDurationMinutes: Number(formData.breakDurationMinutes),
        noShowGraceMinutes: Number(formData.noShowGraceMinutes),
        disputeWindowMinutes: Number(formData.disputeWindowMinutes),
        allowSubstitutions: formData.allowSubstitutions,
      },
      scoringRule: {
        name: presetConfig.name,
        placementPoints: presetConfig.placementPoints,
        killPointsPerElim: Number(formData.killPointsPerElim),
        wwcdBonus: Number(formData.wwcdBonus),
        tieBreakers: presetConfig.tieBreakers,
      },
    };

    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to create tournament');
      }

      router.push(`/tournaments/${data.data.id}`);
    } catch (err: any) {
      setError(err.message || 'Error submitting tournament configuration');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Step Indicator Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black text-white">Create New BGMI Tournament</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Step {step} of 7: {steps[step - 1].title}
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
            {Math.round((step / 7) * 100)}% Complete
          </span>
        </div>

        {/* Progress Bar */}
        <div className="grid grid-cols-7 gap-1.5">
          {steps.map((s) => (
            <div
              key={s.num}
              className={`h-1.5 rounded-full transition-colors ${
                s.num <= step ? 'bg-emerald-500 shadow-sm shadow-emerald-500/40' : 'bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 mb-6 rounded-lg bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 font-medium">
          {error}
        </div>
      )}

      {/* Step Content */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-400" />
              Tournament Information
            </h2>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Tournament Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="e.g. BGMI Winter Invitational"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Organizer Organization *
              </label>
              <input
                type="text"
                value={formData.organizer}
                onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="e.g. Sathyabama Esports Club"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Tournament overview, broadcast links, sponsor acknowledgements..."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Start Date</label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">End Date</label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-400" />
              Tournament Format
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'GROUP_STAGE', label: 'Group Stage (Recommended)', desc: 'Multiple lobbies with top teams qualifying' },
                { id: 'SINGLE_STAGE', label: 'Single Stage', desc: 'Single lobby with fixed 16 squads competing across all matches' },
                { id: 'GROUPS_AND_FINALS', label: 'Groups + Grand Finals', desc: 'Group phase followed by Grand Finals lobby' },
                { id: 'QUALIFIERS_AND_FINALS', label: 'Open Qualifiers + Finals', desc: 'Multi-round elimination into finals' },
              ].map((fmt) => (
                <div
                  key={fmt.id}
                  onClick={() => setFormData({ ...formData, format: fmt.id })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    formData.format === fmt.id
                      ? 'bg-emerald-500/15 border-emerald-500 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="font-bold text-sm text-slate-200">{fmt.label}</p>
                  <p className="text-xs text-slate-400 mt-1">{fmt.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              Squad Limits & Roster Configuration
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Total Participating Teams Cap
                </label>
                <input
                  type="number"
                  value={formData.totalTeamsCap}
                  onChange={(e) => setFormData({ ...formData, totalTeamsCap: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Max Teams Per Lobby / Group
                </label>
                <input
                  type="number"
                  value={formData.maxTeamsPerGroup}
                  onChange={(e) => setFormData({ ...formData, maxTeamsPerGroup: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Squad Size (Starting Lineup)
                </label>
                <input
                  type="number"
                  value={formData.squadSize}
                  onChange={(e) => setFormData({ ...formData, squadSize: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Substitutes Cap (Bench)
                </label>
                <input
                  type="number"
                  value={formData.substitutesCap}
                  onChange={(e) => setFormData({ ...formData, substitutesCap: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Match Schedule Configuration
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Number of Matches to Generate
                </label>
                <input
                  type="number"
                  value={formData.matchCount}
                  onChange={(e) => setFormData({ ...formData, matchCount: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Match Duration (Minutes)
                </label>
                <input
                  type="number"
                  value={formData.matchDurationMinutes}
                  onChange={(e) => setFormData({ ...formData, matchDurationMinutes: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Break Duration (Minutes)
                </label>
                <input
                  type="number"
                  value={formData.breakDurationMinutes}
                  onChange={(e) => setFormData({ ...formData, breakDurationMinutes: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-400" />
              Scoring Engine System
            </h2>
            <div className="space-y-3">
              {[
                {
                  id: 'BGIS_10',
                  name: 'Official BGIS 10-Point System (Recommended)',
                  desc: '1st: 10, 2nd: 6, 3rd: 5, 4th: 4, 5th: 3, 6th: 2, 7th: 1, 8th: 1, 9-16: 0 | 1 Kill = 1 Point',
                },
                {
                  id: 'BMPS_15',
                  name: 'BMPS 15-Point System',
                  desc: '1st: 15, 2nd: 12, 3rd: 10, 4th: 8, 5th: 6, 6th: 4, 7th: 2, 8-12: 1, 13-16: 0 | 1 Kill = 1 Point',
                },
                {
                  id: 'PMCO_20',
                  name: 'Classic PMCO 20-Point System',
                  desc: '1st: 20, 2nd: 14, 3rd: 10, 4th: 8, 5th: 7, 6th: 6, 7th: 5, 8th: 4, 9th: 3, 10th: 2, 11-16: 1',
                },
              ].map((p) => (
                <div
                  key={p.id}
                  onClick={() => setFormData({ ...formData, scoringPreset: p.id })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    formData.scoringPreset === p.id
                      ? 'bg-emerald-500/15 border-emerald-500 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="font-bold text-sm text-slate-200">{p.name}</p>
                  <p className="text-xs text-slate-400 mt-1 font-mono">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Tournament Policies & Integrity
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  No-Show Grace Period (Minutes)
                </label>
                <input
                  type="number"
                  value={formData.noShowGraceMinutes}
                  onChange={(e) => setFormData({ ...formData, noShowGraceMinutes: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Dispute Window Post Match (Minutes)
                </label>
                <input
                  type="number"
                  value={formData.disputeWindowMinutes}
                  onChange={(e) => setFormData({ ...formData, disputeWindowMinutes: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs text-slate-400 space-y-1">
              <p>• Emulator detection strictly enforced: All players must use handheld mobile devices.</p>
              <p>• Tie-Breaker Priority: 1. Total WWCDs, 2. Placement Points, 3. Kill Points, 4. Best Match.</p>
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              Review & Commit Tournament
            </h2>

            <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 text-xs space-y-2 text-slate-300 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Name:</span>
                <span className="text-white font-bold">{formData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Organizer:</span>
                <span className="text-white">{formData.organizer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Format:</span>
                <span className="text-emerald-400">{formData.format}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Max Teams:</span>
                <span className="text-white">{formData.totalTeamsCap} (Lobby cap: {formData.maxTeamsPerGroup})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Scoring Engine:</span>
                <span className="text-amber-400 font-bold">{formData.scoringPreset}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Matches:</span>
                <span className="text-white">{formData.matchCount} matches ({formData.matchDurationMinutes}m + {formData.breakDurationMinutes}m break)</span>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              By launching, default rooms, scoring tables, and initial draft records will be initialized.
            </p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1 || isSubmitting}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold ${
              step === 1 ? 'opacity-40 cursor-not-allowed text-slate-600' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>

          {step < 7 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
            >
              Continue
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              {isSubmitting ? 'Creating Tournament...' : 'Launch Tournament'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
