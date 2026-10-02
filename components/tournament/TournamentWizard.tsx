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
    name: '',
    organizer: '',
    description: '',
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    venue: '',
    contactEmail: '',

    // Step 2: Format
    format: 'GROUP_STAGE',

    // Step 3: Team Config
    totalTeamsCap: 32,
    squadSize: 4,
    substitutesCap: 2,
    maxTeamsPerGroup: 16,

    // Step 4: Match Config
    matchCount: 6,
    maps: ['ERANGEL', 'MIRAMAR', 'SANHOK', 'VIKENDI', 'RONDO'],
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
            <h1 className="text-3xl font-teko uppercase font-bold tracking-wider text-white">
              CREATE NEW <span className="text-[#ffb60e]">BGMI TOURNAMENT</span>
            </h1>
            <p className="text-xs font-condensed uppercase tracking-wider text-gray-400 mt-0.5">
              STEP {step} OF 7: <span className="text-[#ffb60e] font-bold">{steps[step - 1].title}</span>
            </p>
          </div>
          <span className="text-xs font-condensed font-bold uppercase tracking-wider text-[#ffb60e] bg-[#ffb60e]/10 px-3 py-1 tactical-cut border border-[#ffb60e]/30">
            {Math.round((step / 7) * 100)}% COMPLETE
          </span>
        </div>

        {/* Progress Bar */}
        <div className="grid grid-cols-7 gap-1.5">
          {steps.map((s) => (
            <div
              key={s.num}
              className={`h-2 tactical-cut transition-colors ${
                s.num <= step ? 'bg-[#ffb60e] shadow-sm shadow-[#ffb60e]/40' : 'bg-[#222222]'
              }`}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 mb-6 tactical-cut bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 font-condensed font-bold tracking-wide">
          {error}
        </div>
      )}

      {/* Step Content */}
      <div className="bg-[#171716] border border-[#333333] p-6 shadow-2xl">
        <div key={step} className="animate-tab-enter">
          {step === 1 && (
            <div className="space-y-4">
            <h2 className="text-xl font-heading font-black tracking-wider text-white uppercase flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#ffb60e]" />
              Tournament Information
            </h2>
            <div>
              <label className="text-xs font-heading font-bold text-slate-300 block mb-1 uppercase tracking-wider">
                Tournament Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-white/10 text-white tactical-cut px-3 py-2.5 text-xs focus:outline-none focus:border-[#ffb60e] font-sans"
                placeholder="e.g. BGMI Pro Invitational 2026"
              />
            </div>
            <div>
              <label className="text-xs font-heading font-bold text-slate-300 block mb-1 uppercase tracking-wider">
                Organizer Organization *
              </label>
              <input
                type="text"
                value={formData.organizer}
                onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-white/10 text-white tactical-cut px-3 py-2.5 text-xs focus:outline-none focus:border-[#ffb60e] font-sans"
                placeholder="e.g. Krafton Community Esports"
              />
            </div>
            <div>
              <label className="text-xs font-heading font-bold text-slate-300 block mb-1 uppercase tracking-wider">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full bg-[#0a0a0a] border border-white/10 text-white tactical-cut px-3 py-2 text-xs focus:outline-none focus:border-[#ffb60e] font-sans"
                placeholder="Tournament overview, broadcast links, sponsor acknowledgements..."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-heading font-bold text-slate-300 block mb-1 uppercase tracking-wider">Start Date</label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-white/10 text-white tactical-cut px-3 py-2 text-xs focus:outline-none focus:border-[#ffb60e] font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-heading font-bold text-slate-300 block mb-1 uppercase tracking-wider">End Date</label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-white/10 text-white tactical-cut px-3 py-2 text-xs focus:outline-none focus:border-[#ffb60e] font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-heading font-black tracking-wider text-white uppercase flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#ffb60e]" />
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
                  className={`p-4 tactical-cut border cursor-pointer transition-all ${
                    formData.format === fmt.id
                      ? 'bg-[#ffb60e]/15 border-[#ffb60e] text-white shadow-md shadow-[#ffb60e]/15'
                      : 'bg-[#0a0a0a] border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <p className="font-heading font-bold text-base text-white uppercase tracking-wide">{fmt.label}</p>
                  <p className="text-xs text-slate-400 mt-1 font-sans">{fmt.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-heading font-black tracking-wider text-white uppercase flex items-center gap-2">
              <Users className="w-5 h-5 text-[#ffb60e]" />
              Squad Limits & Roster Configuration
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-heading font-bold text-slate-300 block mb-1 uppercase tracking-wider">
                  Total Participating Teams Cap
                </label>
                <input
                  type="number"
                  value={formData.totalTeamsCap}
                  onChange={(e) => setFormData({ ...formData, totalTeamsCap: Number(e.target.value) })}
                  className="w-full bg-[#0a0a0a] border border-white/10 text-white tactical-cut px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-[#ffb60e]"
                />
              </div>
              <div>
                <label className="text-xs font-heading font-bold text-slate-300 block mb-1 uppercase tracking-wider">
                  Max Teams Per Lobby / Group
                </label>
                <input
                  type="number"
                  value={formData.maxTeamsPerGroup}
                  onChange={(e) => setFormData({ ...formData, maxTeamsPerGroup: Number(e.target.value) })}
                  className="w-full bg-[#0a0a0a] border border-white/10 text-white tactical-cut px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-[#ffb60e]"
                />
              </div>
              <div>
                <label className="text-xs font-heading font-bold text-slate-300 block mb-1 uppercase tracking-wider">
                  Squad Size (Starting Lineup)
                </label>
                <input
                  type="number"
                  value={formData.squadSize}
                  onChange={(e) => setFormData({ ...formData, squadSize: Number(e.target.value) })}
                  className="w-full bg-[#0a0a0a] border border-white/10 text-white tactical-cut px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-[#ffb60e]"
                />
              </div>
              <div>
                <label className="text-xs font-heading font-bold text-slate-300 block mb-1 uppercase tracking-wider">
                  Substitutes Cap (Bench)
                </label>
                <input
                  type="number"
                  value={formData.substitutesCap}
                  onChange={(e) => setFormData({ ...formData, substitutesCap: Number(e.target.value) })}
                  className="w-full bg-[#0a0a0a] border border-white/10 text-white tactical-cut px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-[#ffb60e]"
                />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-xl font-teko uppercase tracking-wider text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#ffb60e]" />
              MATCH SCHEDULE CONFIGURATION
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-condensed uppercase tracking-wider font-bold text-gray-300 block mb-1">
                  MATCHES TO GENERATE
                </label>
                <input
                  type="number"
                  value={formData.matchCount}
                  onChange={(e) => setFormData({ ...formData, matchCount: Number(e.target.value) })}
                  className="w-full bg-[#121212] border border-[#333333] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#ffb60e] font-condensed font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-condensed uppercase tracking-wider font-bold text-gray-300 block mb-1">
                  MATCH DURATION (MIN)
                </label>
                <input
                  type="number"
                  value={formData.matchDurationMinutes}
                  onChange={(e) => setFormData({ ...formData, matchDurationMinutes: Number(e.target.value) })}
                  className="w-full bg-[#121212] border border-[#333333] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#ffb60e] font-condensed font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-condensed uppercase tracking-wider font-bold text-gray-300 block mb-1">
                  BREAK DURATION (MIN)
                </label>
                <input
                  type="number"
                  value={formData.breakDurationMinutes}
                  onChange={(e) => setFormData({ ...formData, breakDurationMinutes: Number(e.target.value) })}
                  className="w-full bg-[#121212] border border-[#333333] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#ffb60e] font-condensed font-bold"
                />
              </div>
            </div>

            {/* Map Pool Selector including RONDO */}
            <div className="pt-2">
              <label className="text-xs font-condensed uppercase tracking-wider font-bold text-gray-300 block mb-2">
                MAP ROTATION POOL (CLICK TO TOGGLE MAPS IN SEQUENCE)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {(['ERANGEL', 'MIRAMAR', 'SANHOK', 'VIKENDI', 'RONDO'] as const).map((mapName) => {
                  const isSelected = formData.maps.includes(mapName);
                  return (
                    <button
                      key={mapName}
                      type="button"
                      onClick={() => {
                        const newMaps = isSelected
                          ? formData.maps.filter((m) => m !== mapName)
                          : [...formData.maps, mapName];
                        if (newMaps.length > 0) {
                          setFormData({ ...formData, maps: newMaps });
                        }
                      }}
                      className={`relative overflow-hidden p-3 text-center tactical-cut font-condensed uppercase tracking-wider text-xs font-bold transition-all border group ${
                        isSelected
                          ? 'border-[#ffb60e] text-white shadow-lg shadow-[#ffb60e]/20 ring-1 ring-[#ffb60e]'
                          : 'bg-[#121212] text-gray-400 border-[#333333] hover:border-gray-500 opacity-60 hover:opacity-90'
                      }`}
                    >
                      {/* Map Thumbnail Background */}
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <img
                          src={`/images/maps/${mapName.toLowerCase()}.jpg`}
                          alt=""
                          className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <div className={`absolute inset-0 ${
                          isSelected
                            ? 'bg-gradient-to-t from-black/90 via-black/60 to-black/40'
                            : 'bg-black/80'
                        }`} />
                      </div>

                      <div className="relative z-10">
                        <div className={`text-lg font-teko tracking-wider leading-tight ${isSelected ? 'text-[#ffb60e]' : 'text-gray-300'}`}>
                          {mapName}
                        </div>
                        <div className={`text-[10px] font-extrabold ${isSelected ? 'text-emerald-400' : 'text-gray-500'}`}>
                          {isSelected ? '✓ ACTIVE' : 'DISABLED'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-gray-400 mt-2 font-condensed">
                Active rotation: <span className="text-[#ffb60e] font-bold">{formData.maps.join(' → ')}</span>
              </p>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-xl font-teko uppercase tracking-wider text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#ffb60e]" />
              SCORING ENGINE SYSTEM
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
                  className={`p-4 tactical-cut border cursor-pointer transition-all ${
                    formData.scoringPreset === p.id
                      ? 'bg-[#ffb60e]/15 border-[#ffb60e] text-white shadow-md shadow-[#ffb60e]/10'
                      : 'bg-[#121212] border-[#333333] text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <p className="font-teko uppercase tracking-wider text-lg text-[#ffb60e] leading-tight">{p.name}</p>
                  <p className="text-xs text-gray-300 mt-1 font-condensed font-medium">{p.desc}</p>
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
                <label className="text-xs font-semibold text-gray-300 block mb-1 font-condensed uppercase tracking-wider">
                  No-Show Grace Period (Minutes)
                </label>
                <input
                  type="number"
                  value={formData.noShowGraceMinutes}
                  onChange={(e) => setFormData({ ...formData, noShowGraceMinutes: Number(e.target.value) })}
                  className="w-full bg-[#101010] border border-[#333333] focus:border-[#ffb60e] text-white tactical-cut px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1 font-condensed uppercase tracking-wider">
                  Dispute Window Post Match (Minutes)
                </label>
                <input
                  type="number"
                  value={formData.disputeWindowMinutes}
                  onChange={(e) => setFormData({ ...formData, disputeWindowMinutes: Number(e.target.value) })}
                  className="w-full bg-[#101010] border border-[#333333] focus:border-[#ffb60e] text-white tactical-cut px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>
            <div className="p-3 bg-[#101010] tactical-cut border border-[#333333] text-xs text-gray-400 space-y-1 font-condensed">
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

            <div className="bg-[#101010] tactical-cut p-4 border border-[#333333] text-xs space-y-2 text-gray-300 font-condensed">
              <div className="flex justify-between">
                <span className="text-gray-500">Name:</span>
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
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-[#333333]">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1 || isSubmitting}
            className={`flex items-center gap-1.5 px-4 py-2 tactical-cut text-xs font-condensed uppercase tracking-wider font-bold ${
              step === 1 ? 'opacity-40 cursor-not-allowed text-gray-600 bg-transparent' : 'bg-[#222222] hover:bg-[#2a2a2a] text-gray-300 border border-[#444444]'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            BACK
          </button>

          {step < 7 ? (
            <button
              type="button"
              onClick={handleNext}
              className="tactical-btn-gold px-6 py-2 text-xs flex items-center gap-1.5 shadow-md shadow-[#ffb60e]/20"
            >
              <span>CONTINUE</span>
              <ArrowRight className="w-4 h-4 text-black stroke-[2.5]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="tactical-btn-gold px-7 py-2.5 text-sm flex items-center gap-2 shadow-xl shadow-[#ffb60e]/30"
            >
              <CheckCircle className="w-5 h-5 text-black stroke-[2.5]" />
              <span>{isSubmitting ? 'INITIALIZING TOURNAMENT...' : 'LAUNCH TOURNAMENT'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
