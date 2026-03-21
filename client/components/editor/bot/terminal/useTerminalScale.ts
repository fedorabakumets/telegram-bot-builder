/**
 * @fileoverview Хук для управления масштабом терминала
 *
 * Предоставляет функциональность для изменения масштаба текста.
 *
 * @module useTerminalScale
 */

import { useState } from 'react';

/**
 * Результат работы хука масштаба
 */
interface UseTerminalScaleResult {
  scale: number;
  adjustScale: (factor: number) => void;
}

/**
 * Хук для управления масштабом терминала
 * @param initialScale - Начальный масштаб
 * @returns Объект с масштабом и методами управления
 */
export function useTerminalScale(initialScale: number = 1): UseTerminalScaleResult {
  const [scale, setScale] = useState<number>(initialScale);

  /**
   * Изменить масштаб текста
   * @param factor - Множитель для изменения масштаба
   */
  const adjustScale = (factor: number) => {
    setScale(prevScale => Math.max(0.5, Math.min(2, prevScale * factor)));
  };

  return {
    scale,
    adjustScale
  };
}
