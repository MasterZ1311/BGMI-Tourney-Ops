'use client';

import React, { useState, useEffect } from 'react';
import './globals.css';
import { Header } from '@/components/shared/Header';
import { ShortcutsModal } from '@/components/shared/ShortcutsModal';
import { QuickSearchModal } from '@/components/shared/QuickSearchModal';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    <html lang="en" className="dark">
      <head>
        <title>BGMI Tournament Control Center — Esports Operations</title>
        <meta
          name="description"
          content="The official tournament operations dashboard for Battlegrounds Mobile India."
        />
      </head>
      <body className="bg-[#090d16] text-slate-100 min-h-screen font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
        <Header
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
        />
        <main>{children}</main>

        <ShortcutsModal
          isOpen={isShortcutsOpen}
          onClose={() => setIsShortcutsOpen(false)}
        />
        <QuickSearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />
      </body>
    </html>
  );
}
