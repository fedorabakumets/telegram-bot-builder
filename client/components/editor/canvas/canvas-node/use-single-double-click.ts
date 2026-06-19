/**
 * @fileoverview Хук различения одиночного и двойного клика
 *
 * Откладывает обработку одиночного клика на ~250мс и отменяет его,
 * если за это время произошёл двойной клик. Используется порталами,
 * где одиночный клик переключает лист, а двойной — переходит к ноде.
 *
 * @module canvas-node/use-single-double-click
 */

import { useCallback, useEffect, useRef } from 'react';

/** Задержка ожидания двойного клика, мс */
const DOUBLE_CLICK_DELAY = 250;

/**
 * Возвращает обработчики onClick/onDoubleClick с подавлением
 * одиночного клика при двойном.
 *
 * @param onSingle - Колбэк одиночного клика
 * @param onDouble - Колбэк двойного клика
 * @returns Объект с обработчиками handleClick и handleDoubleClick
 */
export function useSingleDoubleClick(
  onSingle: () => void,
  onDouble: () => void,
): { handleClick: () => void; handleDoubleClick: () => void } {
  /** Таймер отложенного одиночного клика */
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      onSingle();
    }, DOUBLE_CLICK_DELAY);
  }, [onSingle]);

  const handleDoubleClick = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    onDouble();
  }, [onDouble]);

  return { handleClick, handleDoubleClick };
}
