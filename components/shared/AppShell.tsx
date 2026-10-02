'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Header } from './Header';
import { ShortcutsModal } from './ShortcutsModal';
import { QuickSearchModal } from './QuickSearchModal';
import { Watermark } from './Watermark';
import { ClickSoundProvider } from './ClickSoundProvider';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if active inside input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      if (e.key === '/' || (e.ctrlKey && e.key === '/')) {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen(true);
      } else if (e.key === 'Escape') {
        setIsShortcutsOpen(false);
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ClickSoundProvider>
      {/* Background Wallpaper: BGMI Lone Survivor with Subdued Atmospheric Opacity */}
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
        aria-hidden="true"
      >
        <Image
          src="/images/Wallpaper.jpg"
          alt="BGMI Battleground Atmospheric Wallpaper"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-[0.09] filter contrast-125 brightness-95"
        />
        {/* Subtle Krafton Dark Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#101010]/60 via-transparent to-[#101010]/85" />
      </div>

      <Header
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />
      <main className="relative z-10">{children}</main>

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
      <Watermark />
    </ClickSoundProvider>
  );
}
