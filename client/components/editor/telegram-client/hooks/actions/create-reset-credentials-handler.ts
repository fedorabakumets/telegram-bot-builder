/**
 * @fileoverview Функция создания обработчика сброса credentials
 *
 * @module createResetCredentialsHandler
 */

import type { NotificationService } from '../../services';
import { resetCredentials as resetCredentialsFn } from '../reset-credentials';

/**
 * Параметры для создания обработчика сброса
 */
export interface CreateResetCredentialsHandlerParams {
  /** Установить статус загрузки */
  setIsLoading: (value: boolean) => void;
  /** Установить API ID */
  setApiId: (value: string) => void;
  /** Установить API Hash */
  setApiHash: (value: string) => void;
  /** Функция загрузки статуса (для обновления) */
  loadStatus: () => Promise<void>;
  /** Сервис уведомлений */
  notifications: NotificationService;
}

/**
 * Создаёт функцию сброса API credentials
 *
 * @param params - Параметры обработчика
 * @returns Функция сброса credentials
 *
 * @example
 * ```tsx
 * const resetCredentials = createResetCredentialsHandler({
 *   setIsLoading,
 *   setApiId,
 *   setApiHash,
 *   loadStatus,
 *   notifications
 * });
 * await resetCredentials();
 * ```
 */
export function createResetCredentialsHandler(
  params: CreateResetCredentialsHandlerParams
): () => Promise<void> {
  const { setIsLoading, setApiId, setApiHash, loadStatus, notifications } = params;

  return async () => {
    setIsLoading(true);
    try {
      await resetCredentialsFn();
      setApiId('');
      setApiHash('');
      notifications.info('Сброшено', 'API credentials удалены. Введите новые данные');
      loadStatus();
    } catch (error) {
      console.error('Ошибка сброса credentials:', error);
      notifications.error('Ошибка', 'Не удалось сбросить credentials');
    } finally {
      setIsLoading(false);
    }
  };
}
