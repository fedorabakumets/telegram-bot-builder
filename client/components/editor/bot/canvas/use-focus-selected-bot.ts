/**
 * @fileoverview Фокус камеры: нода у левого края правого overlay (Railway)
 * @module bot/canvas/use-focus-selected-bot
 */

import { useEffect, type RefObject } from 'react';
import type { NodePos } from './use-bot-node-layout';

const NODE_W = 220;
const NODE_H = 88;

/** Опции фокуса на выбранном боте */
interface UseFocusSelectedBotOptions {
  /** Выбранный tokenId */
  selectedTokenId: number | null;
  /** Позиции нод */
  positions: Record<number, NodePos>;
  /** Ref viewport холста */
  canvasRef: RefObject<HTMLDivElement | null>;
  /** Текущий zoom % через ref */
  zoomRef: { current: number };
  /** Ref pan */
  panRef: { current: { x: number; y: number } };
  /** Установить pan */
  setPan: (pan: { x: number; y: number }) => void;
  /** Анимация transform */
  triggerTransformAnimation: () => void;
  /** Ширина правого overlay в px (0 если закрыт) */
  overlayPanelWidth?: number;
}

/**
 * Подводит выбранную ноду к шву холст/панель (слева от overlay)
 * @param options - Опции
 */
export function useFocusSelectedBot({
  selectedTokenId,
  positions,
  canvasRef,
  zoomRef,
  panRef,
  setPan,
  triggerTransformAnimation,
  overlayPanelWidth = 0,
}: UseFocusSelectedBotOptions) {
  useEffect(() => {
    if (selectedTokenId == null) return;
    const pos = positions[selectedTokenId];
    if (!pos) return;

    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      const el = canvasRef.current;
      if (!el) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w < 40 || h < 40) return;

      const scale = zoomRef.current / 100;
      const panel = Math.min(overlayPanelWidth, w * 0.55);
      const visibleRight = w - panel;
      const gap = 24;
      const targetScreenX = Math.max(16, visibleRight - gap - NODE_W * scale);
      const targetScreenY = h / 2 - (NODE_H * scale) / 2;
      const newPan = {
        x: targetScreenX - pos.left * scale,
        y: targetScreenY - pos.top * scale,
      };
      triggerTransformAnimation();
      panRef.current = newPan;
      setPan(newPan);
    };

    const t1 = window.setTimeout(run, 40);
    const t2 = window.setTimeout(run, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [
    selectedTokenId,
    positions,
    canvasRef,
    zoomRef,
    panRef,
    setPan,
    triggerTransformAnimation,
    overlayPanelWidth,
  ]);
}
