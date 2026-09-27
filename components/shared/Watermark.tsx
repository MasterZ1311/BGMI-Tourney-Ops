'use client';

import React from 'react';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';

export function Watermark() {
  return (
    <aside
      aria-label="Developer Watermark"
      className="fixed bottom-4 left-4 md:bottom-5 md:left-5 z-40 select-none print:hidden"
    >
      <a
        href="https://thenappant-portfolio.vercel.app/"
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center"
        title="Created by MasterZ — View Developer Portfolio"
      >
        {/* Outer Glow Ring on Hover */}
        <span
          className="absolute inset-0 rounded-full bg-[#ffb60e]/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          aria-hidden="true"
        />

        {/* Circular Avatar Container */}
        <div className="relative w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-white/20 bg-black/90 p-0.5 overflow-hidden transition-all duration-300 group-hover:border-[#ffb60e] group-hover:scale-110 shadow-lg shadow-black/80 group-hover:shadow-[#ffb60e]/30 flex items-center justify-center">
          <Image
            src="/images/MZ_logo.svg"
            alt="MasterZ Logo"
            width={36}
            height={36}
            className="w-full h-full object-contain rounded-full transition-transform duration-300 group-hover:rotate-6"
            priority
          />
        </div>

        {/* Tactical Hover Tooltip Badge */}
        <div
          role="tooltip"
          className="pointer-events-none absolute left-full ml-3 hidden sm:flex items-center gap-2 px-2.5 py-1 bg-[#121212]/95 border border-[#ffb60e]/40 shadow-xl backdrop-blur-md opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap tactical-cut"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#ffb60e] animate-pulse" />
          <span className="font-heading text-xs tracking-widest text-white uppercase font-bold">
            DEV // MASTERZ
          </span>
          <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-[#ffb60e] transition-colors" />
        </div>
      </a>
    </aside>
  );
}
