/**
 * @fileoverview Функция создания обработчика сохранения credentials
 *
 * @module createSaveCredentialsHandler
 */

import type { ApiCredentials } from '../../types';
import type { NotificationService } from '../../services';
import { createLogger } from '../../services/logger-service';
import { validateApiCredentials } from '../../services/validation-service';
import { saveCredentials as saveCredentialsFn } from '../save-credentials';

const logger = createLogger({ prefix: '[TelegramAuth]' });

/**
 * Параметры для создания обработчика сохранения
 */
export interface CreateSaveCredentialsHandlerParams {
  /** Установить статус загрузки */
  setIsLoading: (value: boolean) => void;
  /** Функция загрузки статуса (для обновления) */
  loadStatus: () => Promise<void>;
  /** Сервис уведомлений */
  notifications: NotificationService;
}

/**
 * Создаёт функцию сохранения API credentials
 *
 * @param params - Параметры обработчика
 * @returns Функция сохранения credentials
 *
 * @example
 * ```tsx
 * const saveCredentials = createSaveCredentialsHandler({
 *   setIsLoading,
 *   loadStatus,
 *   notifications
 * });
 * await saveCredentials({ apiId, apiHash });
 * ```
 */
export function createSaveCredentialsHandler(
  params: CreateSaveCredentialsHandlerParams
): (credentials: ApiCredentials) => Promise<void> {
  const { setIsLoading, loadStatus, notifications } = params;

  return async (credentials: ApiCredentials) => {
    const errors = validateApiCredentials(credentials);
    if (Object.keys(errors).length > 0) {
      const message = Object.values(errors).join(', ');
      notifications.error('Ошибка валидации', message);
      return;
    }

    setIsLoading(true);
    try {
      await saveCredentialsFn(credentials);
      notifications.success('Успешно', 'API credentials сохранены');
      loadStatus();
    } catch (error) {
      logger.error('Ошибка сохранения credentials', error);
      notifications.error('Ошибка', 'Не удалось сохранить credentials');
    } finally {
      setIsLoading(false);
    }
  };
}
