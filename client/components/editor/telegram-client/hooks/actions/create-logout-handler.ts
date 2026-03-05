/**
 * @fileoverview Функция создания обработчика выхода
 *
 * @module createLogoutHandler
 */

import type { NotificationService } from '../../services';
import { logout as logoutFn } from '../logout';

/**
 * Параметры для создания обработчика выхода
 */
export interface CreateLogoutHandlerParams {
  /** Установить статус загрузки */
  setIsLoading: (value: boolean) => void;
  /** Функция загрузки статуса (для обновления) */
  loadStatus: () => Promise<void>;
  /** Сервис уведомлений */
  notifications: NotificationService;
}

/**
 * Создаёт функцию выхода из аккаунта
 *
 * @param params - Параметры обработчика
 * @returns Функция выхода
 *
 * @example
 * ```tsx
 * const logout = createLogoutHandler({ setIsLoading, loadStatus, notifications });
 * await logout();
 * ```
 */
export function createLogoutHandler(
  params: CreateLogoutHandlerParams
): () => Promise<void> {
  const { setIsLoading, loadStatus, notifications } = params;

  return async () => {
    setIsLoading(true);
    try {
      await logoutFn();
      notifications.success('Выполнен выход', 'Вы успешно вышли из аккаунта');
      loadStatus();
    } catch (error) {
      console.error('Ошибка выхода:', error);
      notifications.error('Ошибка', 'Не удалось выполнить выход');
    } finally {
      setIsLoading(false);
    }
  };
}
