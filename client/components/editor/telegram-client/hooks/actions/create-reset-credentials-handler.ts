/**
 * @fileoverview Функция создания обработчика сброса credentials
 *
 * @module createResetCredentialsHandler
 */

import { useToast } from '@/hooks/use-toast';
import { resetCredentials as resetCredentialsFn } from './reset-credentials';

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
 *   loadStatus
 * });
 * await resetCredentials();
 * ```
 */
export function createResetCredentialsHandler(
  params: CreateResetCredentialsHandlerParams
): () => Promise<void> {
  const { setIsLoading, setApiId, setApiHash, loadStatus } = params;
  const { toast } = useToast();

  return async () => {
    setIsLoading(true);
    try {
      const result = await resetCredentialsFn();
      toast({ title: 'Сброшено', description: result.message });
      setApiId('');
      setApiHash('');
      loadStatus();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сбросить credentials',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
}
