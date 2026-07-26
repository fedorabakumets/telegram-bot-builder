/**
 * @fileoverview Ширина overlay detail-панели бота с drag-ресайзом
 * @module bot/canvas/use-bot-detail-panel-width
 */

import { useCallback, useEffect, useState } from 'react';

/** Ключ localStorage */
const STORAGE_KEY = 'bot-detail-overlay-width';

/** Ширина по умолчанию */
export const DEFAULT_DETAIL_WIDTH = 520;

/** Минимальная ширина панели */
const MIN_W = 320;

/** Максимальная доля viewport */
const MAX_VW = 0.72;

/**
 * Читает сохранённую ширину
 * @returns Ширина в px
 */
function readStoredWidth(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const n = raw ? Number(raw) : NaN;
    if (Number.isFinite(n) && n >= MIN_W) return Math.round(n);
  } catch {
    /* ignore */
  }
  return DEFAULT_DETAIL_WIDTH;
}

/**
 * Хук ширины правой detail-панели с drag
 * @returns Ширина, clamp по viewport и обработчик pointerdown на ручке
 */
export function useBotDetailPanelWidth() {
  const [width, setWidth] = useState(DEFAULT_DETAIL_WIDTH);

  useEffect(() => {
    setWidth(readStoredWidth());
  }, []);

  /**
   * Ограничивает ширину по viewport
   * @param px - Желаемая ширина
   * @returns Clamp-значение
   */
  const clamp = useCallback((px: number) => {
    const max = Math.floor(window.innerWidth * MAX_VW);
    return Math.max(MIN_W, Math.min(max, Math.round(px)));
  }, []);

  /**
   * Старт drag ресайза (вешать на ручку слева)
   * @param e - Pointer event
   */
  const onResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startW = width;
      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);

      const onMove = (ev: PointerEvent) => {
        const next = clamp(startW + (startX - ev.clientX));
        setWidth(next);
      };
      const onUp = (ev: PointerEvent) => {
        target.releasePointerCapture(ev.pointerId);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        setWidth((w) => {
          const saved = clamp(w);
          try {
            localStorage.setItem(STORAGE_KEY, String(saved));
          } catch {
            /* ignore */
          }
          return saved;
        });
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [clamp, width],
  );

  return { width, onResizePointerDown, clamp };
}
