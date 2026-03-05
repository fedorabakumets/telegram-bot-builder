/**
 * @fileoverview Функция создания обработчика загрузки статуса
 *
 * @module createLoadStatusHandler
 */

import type { AuthStatus } from '../../types';
import type { NotificationService } from '../../services';
import { createLogger } from '../../services/logger-service';
import { loadAuthStatus } from '../load-auth-status';

const logger = createLogger({ prefix: '[TelegramAuth]' });

/**
 * Параметры для создания обработчика загрузки
 */
export interface CreateLoadStatusHandlerParams {
  /** Установить статус авторизации */
  setAuthStatus: (status: AuthStatus) => void;
  /** Сервис уведомлений */
  notifications: NotificationService;
}

/**
 * Создаёт функцию загрузки статуса авторизации
 *
 * @param params - Параметры обработчика
 * @returns Функция загрузки статуса
 *
 * @example
 * ```tsx
 * const loadStatus = createLoadStatusHandler({ setAuthStatus, notifications });
 * await loadStatus();
 * ```
 */
export function createLoadStatusHandler(
  params: CreateLoadStatusHandlerParams
): () => Promise<void> {
  const { setAuthStatus, notifications } = params;

  return async () => {
    try {
      const status = await loadAuthStatus();
      setAuthStatus(status);
    } catch (error) {
      logger.error('Ошибка загрузки статуса', error);
      notifications.error('Ошибка', 'Не удалось загрузить статус авторизации');
    }
  };
}
