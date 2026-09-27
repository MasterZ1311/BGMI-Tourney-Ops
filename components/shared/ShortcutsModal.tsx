'use client';

import React from 'react';
import { X, Keyboard } from 'lucide-react';

export function ShortcutsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '/', description: 'Focus Global Search' },
    { key: 'N', description: 'Create New Item / Match' },
    { key: 'M', description: 'Jump to Current Live Match Operations' },
    { key: 'L', description: 'Jump to Official Leaderboard' },
    { key: 'A', description: 'Jump to Attendance Check-In Hub' },
    { key: 'S', description: 'Open Rapid Score Entry Grid' },
    { key: '?', description: 'Open this Keyboard Shortcuts Help dialog' },
    { key: 'Esc', description: 'Close any modal or dialog' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="tactical-cut bg-[#121212] border border-white/10 max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-[#ffb60e]" />
            <h3 className="text-xl font-heading font-black tracking-wider text-white uppercase">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 tactical-cut hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-3 mb-4 font-sans">
          Speed up match-day operations with single-key shortcuts from anywhere in the platform:
        </p>

        <div className="space-y-2">
          {shortcuts.map((sc) => (
            <div
              key={sc.key}
              className="flex items-center justify-between p-2.5 tactical-cut bg-[#0a0a0a] border border-white/10"
            >
              <span className="text-xs text-slate-300 font-sans">{sc.description}</span>
              <kbd className="px-2.5 py-1 text-xs font-mono font-bold text-[#ffb60e] bg-[#181818] border border-[#ffb60e]/30 tactical-cut shadow">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-heading font-black tracking-wider uppercase bg-[#1c1c1c] hover:bg-[#282828] text-white tactical-cut border border-white/10 transition-colors"
          >
            Got it (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
