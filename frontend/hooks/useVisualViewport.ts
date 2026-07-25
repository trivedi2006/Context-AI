'use client';

import { useState, useEffect } from 'react';

export interface VisualViewportState {
  viewportHeight: number;
  isKeyboardOpen: boolean;
  keyboardHeight: number;
}

export function useVisualViewport(): VisualViewportState {
  const [viewportState, setViewportState] = useState<VisualViewportState>({
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    isKeyboardOpen: false,
    keyboardHeight: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) {
      return;
    }

    const vv = window.visualViewport;

    const handleResizeOrScroll = () => {
      const windowHeight = window.innerHeight;
      const currentHeight = vv.height;
      const keyboardDiff = windowHeight - currentHeight;

      // Soft keyboard open threshold > 150px
      const isKeyboardOpen = keyboardDiff > 150;

      setViewportState({
        viewportHeight: currentHeight,
        isKeyboardOpen,
        keyboardHeight: isKeyboardOpen ? keyboardDiff : 0,
      });
    };

    vv.addEventListener('resize', handleResizeOrScroll);
    vv.addEventListener('scroll', handleResizeOrScroll);
    window.addEventListener('resize', handleResizeOrScroll);

    // Initial check
    handleResizeOrScroll();

    return () => {
      vv.removeEventListener('resize', handleResizeOrScroll);
      vv.removeEventListener('scroll', handleResizeOrScroll);
      window.removeEventListener('resize', handleResizeOrScroll);
    };
  }, []);

  return viewportState;
}
