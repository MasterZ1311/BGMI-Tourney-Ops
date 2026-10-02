'use client';

import React, { useEffect } from 'react';
import { clickSound, playClickSound } from '@/lib/audio/click-sound';

export function ClickSoundProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize Web Audio buffer and fallback audio on client mount
    clickSound.init();

    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Identify if target or any parent is a button or interactive tactical element
      const clickableButton = target.closest<HTMLElement>(
        'button:not([disabled]):not([aria-disabled="true"]), ' +
        '[role="button"]:not([disabled]):not([aria-disabled="true"]), ' +
        'input[type="button"]:not([disabled]), ' +
        'input[type="submit"]:not([disabled]), ' +
        'input[type="reset"]:not([disabled]), ' +
        '.tactical-btn-gold, ' +
        '[data-sound="click"]'
      );

      if (clickableButton) {
        playClickSound();
      }
    };

    // Capture phase ensures the click sound triggers even if child handlers stop propagation
    document.addEventListener('click', handleDocumentClick, { capture: true, passive: true });

    return () => {
      document.removeEventListener('click', handleDocumentClick, { capture: true });
    };
  }, []);

  return <>{children}</>;
}
