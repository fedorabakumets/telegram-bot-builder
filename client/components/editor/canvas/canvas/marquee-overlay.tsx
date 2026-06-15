/**
 * @fileoverview Компонент отрисовки рамки выделения (marquee) поверх холста
 * @module canvas/marquee-overlay
 */

import { MarqueeRect } from './utils/marquee-intersection';

/**
 * Свойства компонента отрисовки рамки
 */
interface MarqueeOverlayProps {
  /** Прямоугольник рамки в screen-координатах холста или null если рамка не активна */
  rect: MarqueeRect | null;
}

/**
 * Компонент отрисовки прямоугольной рамки выделения.
 * Рендерится только когда рамка активна.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент рамки или null
 */
export function MarqueeOverlay({ rect }: MarqueeOverlayProps) {
  if (!rect) return null;

  const left = Math.min(rect.startX, rect.currentX);
  const top = Math.min(rect.startY, rect.currentY);
  const width = Math.abs(rect.currentX - rect.startX);
  const height = Math.abs(rect.currentY - rect.startY);

  return (
    <div
      className="absolute z-20 pointer-events-none border-2 border-dashed border-indigo-400 bg-indigo-500/10 rounded-sm"
      style={{ left, top, width, height }}
    />
  );
}
