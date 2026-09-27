'use client';

import React, { useState } from 'react';
import Papa from 'papaparse';
import { Upload, X, CheckCircle, AlertTriangle, FileSpreadsheet, Download } from 'lucide-react';

export function BulkImportModal({
  isOpen,
  onClose,
  tournamentId,
  onImportComplete,
}: {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  onImportComplete: () => void;
}) {
  const [csvText, setCsvText] = useState('');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const sampleCsv = `Team Name,Tag,Captain,Player 1,P1 UID,Player 2,P2 UID,Player 3,P3 UID,Player 4,P4 UID,Substitute,Sub UID
Team Soul,SOUL,Manya,Manya,5129481928,Nakul,5192837461,Joker,5182736450,Rony,5173645281,Mortal,5102938475
GodLike Esports,GODL,Jonathan,JONATHAN,5112233445,Neyoo,5122334455,ZGOD,5133445566,Punkk,5144556677,Kronten,5155667788
Team XSpark,TX,Shadow,SHADOW,5211223344,Spraygod,5222334455,Sarang,5233445566,NinjaJod,5244556677,ScoutOP,5255667788`;

  const parseAndPreview = async (text: string) => {
    setError(null);
    setIsPreviewing(true);

    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const mappedRows = results.data.map((row: any) => ({
            teamName: row['Team Name'] || row.teamName || row.Team || '',
            tag: row.Tag || row.tag || '',
            captainName: row.Captain || row.captainName || '',
            p1Ign: row['Player 1'] || row.p1Ign || '',
            p1Id: row['P1 UID'] || row.p1Id || '',
            p2Ign: row['Player 2'] || row.p2Ign || '',
            p2Id: row['P2 UID'] || row.p2Id || '',
            p3Ign: row['Player 3'] || row.p3Ign || '',
            p3Id: row['P3 UID'] || row.p3Id || '',
            p4Ign: row['Player 4'] || row.p4Ign || '',
            p4Id: row['P4 UID'] || row.p4Id || '',
            subIgn: row.Substitute || row.subIgn || '',
            subId: row['Sub UID'] || row.subId || '',
          }));

          const res = await fetch(`/api/tournaments/${tournamentId}/teams/import`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rows: mappedRows, dryRun: true }),
          });

          const data = await res.json();
          if (!data.success) {
            throw new Error(data.error?.message || 'Failed to preview CSV import');
          }

          setPreviewResult({ ...data.data, rawRows: mappedRows });
        } catch (err: any) {
          setError(err.message || 'Error processing CSV rows');
        } finally {
          setIsPreviewing(false);
        }
      },
    });
  };

  const handleCommit = async () => {
    if (!previewResult || !previewResult.rawRows) return;
    setIsCommitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/teams/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: previewResult.rawRows, dryRun: false }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to import teams');
      }

      onImportComplete();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error importing teams');
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Bulk Import BGMI Squads</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Paste CSV Data or Sample Roster
              </label>
              <button
                type="button"
                onClick={() => {
                  setCsvText(sampleCsv);
                  parseAndPreview(sampleCsv);
                }}
                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Download className="w-3 h-3" /> Load Sample BGMI CSV
              </button>
            </div>
            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Team Name,Tag,Captain,Player 1,P1 UID,Player 2,P2 UID,Player 3,P3 UID,Player 4,P4 UID,Substitute,Sub UID..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => parseAndPreview(csvText)}
              disabled={isPreviewing || !csvText.trim()}
              className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700"
            >
              {isPreviewing ? 'Validating...' : 'Validate CSV Rows'}
            </button>
          </div>

          {/* Validation Preview Results */}
          {previewResult && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Validation Summary
                </span>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> {previewResult.validCount} Valid Squads
                  </span>
                  {previewResult.invalidCount > 0 && (
                    <span className="text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> {previewResult.invalidCount} Errors
                    </span>
                  )}
                </div>
              </div>

              {previewResult.errors && previewResult.errors.length > 0 && (
                <div className="space-y-1 max-h-32 overflow-y-auto text-[11px] text-rose-300 font-mono">
                  {previewResult.errors.map((err: any, i: number) => (
                    <div key={i} className="p-1.5 rounded bg-rose-950/40 border border-rose-900/50">
                      Row #{err.rowNumber} ({err.team}): {err.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>

          <button
            onClick={handleCommit}
            disabled={isCommitting || !previewResult || previewResult.validCount === 0}
            className="px-5 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-md shadow-emerald-500/20 disabled:opacity-50"
          >
            {isCommitting
              ? 'Importing...'
              : `Commit & Import ${previewResult?.validCount || 0} Teams`}
          </button>
        </div>
      </div>
    </div>
  );
}
