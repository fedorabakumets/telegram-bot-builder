/**
 * @fileoverview Функция создания обработчика выхода
 *
 * @module createLogoutHandler
 */

import { useToast } from '@/hooks/use-toast';
import { logout as logoutFn } from './logout';

/**
 * Параметры для создания обработчика выхода
 */
export interface CreateLogoutHandlerParams {
  /** Установить статус загрузки */
  setIsLoading: (value: boolean) => void;
  /** Функция загрузки статуса (для обновления) */
  loadStatus: () => Promise<void>;
}

/**
 * Создаёт функцию выхода из аккаунта
 *
 * @param params - Параметры обработчика
 * @returns Функция выхода
 *
 * @example
 * ```tsx
 * const logout = createLogoutHandler({ setIsLoading, loadStatus });
 * await logout();
 * ```
 */
export function createLogoutHandler(
  params: CreateLogoutHandlerParams
): () => Promise<void> {
  const { setIsLoading, loadStatus } = params;
  const { toast } = useToast();

  return async () => {
    setIsLoading(true);
    try {
      const result = await logoutFn();
      toast({ title: 'Выполнен выход', description: result.message });
      loadStatus();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось выполнить выход',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
}
