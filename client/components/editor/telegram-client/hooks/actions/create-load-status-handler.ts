/**
 * @fileoverview Функция создания обработчика загрузки статуса
 *
 * @module createLoadStatusHandler
 */

import type { AuthStatus } from '../../types';
import { loadAuthStatus } from '../load-auth-status';

/**
 * Параметры для создания обработчика загрузки
 */
export interface CreateLoadStatusHandlerParams {
  /** Установить статус авторизации */
  setAuthStatus: (status: AuthStatus) => void;
}

/**
 * Создаёт функцию загрузки статуса авторизации
 *
 * @param params - Параметры обработчика
 * @returns Функция загрузки статуса
 *
 * @example
 * ```tsx
 * const loadStatus = createLoadStatusHandler({ setAuthStatus });
 * await loadStatus();
 * ```
 */
export function createLoadStatusHandler(
  params: CreateLoadStatusHandlerParams
): () => Promise<void> {
  const { setAuthStatus } = params;

  return async () => {
    try {
      const status = await loadAuthStatus();
      setAuthStatus(status);
    } catch (error) {
      console.error('Ошибка загрузки статуса:', error);
    }
  };
}
