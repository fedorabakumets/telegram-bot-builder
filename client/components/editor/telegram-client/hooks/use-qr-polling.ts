/**
 * @fileoverview Хук polling для автообновления QR-токена
 *
 * @module useQrPolling
 */

import { useEffect } from 'react';
import type { AuthStep } from '../types';
import { QR_POLL_INTERVAL } from '../constants';

/**
 * Параметры для useQrPolling
 */
export interface UseQrPollingParams {
  /** Текущий шаг авторизации */
  step: AuthStep;
  /** Токен QR-кода */
  token: string;
  /** Функция обновления токена */
  refreshQrToken: () => Promise<void>;
}

/**
 * Хук polling для автообновления QR-токена
 *
 * @param {UseQrPollingParams} params - Параметры polling
 *
 * @example
 * ```tsx
 * useQrPolling({ step, token: qrState.token, refreshQrToken });
 * ```
 */
export function useQrPolling({ step, token, refreshQrToken }: UseQrPollingParams) {
  useEffect(() => {
    if (step !== 'qr' && step !== 'qr-password') return;
    if (!token) return;

    const refreshInterval = setInterval(async () => {
      await refreshQrToken();
    }, QR_POLL_INTERVAL);

    return () => {
      clearInterval(refreshInterval);
    };
  }, [step, token, refreshQrToken]);
}
