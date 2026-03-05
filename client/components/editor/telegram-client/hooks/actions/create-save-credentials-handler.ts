/**
 * @fileoverview Функция создания обработчика сохранения credentials
 *
 * @module createSaveCredentialsHandler
 */

import { useToast } from '@/hooks/use-toast';
import type { ApiCredentials } from '../types';
import { saveCredentials as saveCredentialsFn } from './save-credentials';

/**
 * Параметры для создания обработчика сохранения
 */
export interface CreateSaveCredentialsHandlerParams {
  /** Установить статус загрузки */
  setIsLoading: (value: boolean) => void;
  /** Функция загрузки статуса (для обновления) */
  loadStatus: () => Promise<void>;
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
 *   loadStatus
 * });
 * await saveCredentials({ apiId, apiHash });
 * ```
 */
export function createSaveCredentialsHandler(
  params: CreateSaveCredentialsHandlerParams
): (credentials: ApiCredentials) => Promise<void> {
  const { setIsLoading, loadStatus } = params;
  const { toast } = useToast();

  return async (credentials: ApiCredentials) => {
    if (!credentials.apiId.trim() || !credentials.apiHash.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Заполните API ID и API Hash',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await saveCredentialsFn(credentials);
      toast({ title: 'Успешно', description: result.message });
      loadStatus();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить credentials',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
}
