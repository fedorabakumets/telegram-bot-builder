/**
 * @fileoverview Fullscreen холста: API + CSS-fallback
 * @module bot/canvas/use-canvas-fullscreen
 */

import { useCallback, useEffect, useState, type RefObject } from 'react';

/**
 * Переключение fullscreen для корневого элемента холста
 * @param rootRef - Ref корня холста
 * @returns isFullscreen и toggleFullscreen
 */
export function useCanvasFullscreen(rootRef: RefObject<HTMLDivElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cssFullscreen, setCssFullscreen] = useState(false);

  useEffect(() => {
    const syncFs = () => setIsFullscreen(!!document.fullscreenElement || cssFullscreen);
    document.addEventListener('fullscreenchange', syncFs);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && cssFullscreen) {
        setCssFullscreen(false);
        setIsFullscreen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('fullscreenchange', syncFs);
      document.removeEventListener('keydown', onKey);
    };
  }, [cssFullscreen]);

  const toggleFullscreen = useCallback(async () => {
    const el = rootRef.current;
    if (!el) return;
    if (document.fullscreenElement || cssFullscreen) {
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
      setCssFullscreen(false);
      setIsFullscreen(false);
      return;
    }
    try {
      await el.requestFullscreen();
      setIsFullscreen(true);
    } catch {
      setCssFullscreen(true);
      setIsFullscreen(true);
    }
  }, [cssFullscreen, rootRef]);

  return { isFullscreen, cssFullscreen, toggleFullscreen };
}
