'use client';

import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { ShortcutsModal } from './ShortcutsModal';
import { QuickSearchModal } from './QuickSearchModal';
import { Watermark } from './Watermark';

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
    <>
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
      <Watermark />
    </>
  );
}
