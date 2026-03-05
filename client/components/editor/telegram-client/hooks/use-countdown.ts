/**
 * @fileoverview Хук обратного отсчёта для QR-кода
 *
 * Уменьшает счётчик каждую секунду до 0, затем сбрасывается.
 *
 * @module useCountdown
 */

import { useEffect, useState } from 'react';

/**
 * Параметры хука useCountdown
 */
export interface UseCountdownParams {
  /** Начальное значение счётчика */
  initialValue: number;
  /** Активен ли отсчёт */
  isActive: boolean;
}

/**
 * Хук обратного отсчёта
 *
 * @param params - Параметры отсчёта
 * @returns {number} Текущее значение счётчика
 *
 * @example
 * ```tsx
 * const countdown = useCountdown({ initialValue: 30, isActive: true });
 * ```
 */
export function useCountdown({ initialValue, isActive }: UseCountdownParams): number {
  const [countdown, setCountdown] = useState(initialValue);

  useEffect(() => {
    if (!isActive) return;

    setCountdown(initialValue);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) return initialValue;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [initialValue, isActive]);

  return countdown;
}
