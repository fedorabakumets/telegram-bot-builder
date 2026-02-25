/**
 * @fileoverview Хук для обновления токена бота
 *
 * Предоставляет функциональность для:
 * - Валидации токена через Telegram API
 * - Обновления токена в системе
 * - Остановки бота с предыдущим токеном
 * - Уведомлений об успешном обновлении
 *
 * @module useTokenUpdate
 */

import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { validateBotToken } from './tokenValidation';

/**
 * Результат обновления токена
 */
interface TokenUpdateResult {
  isValidating: boolean;
  error: string | null;
  updateToken: (token: string, tokenId: number, projectId: number) => Promise<boolean>;
  clearError: () => void;
}

/**
 * Хук для обновления токена бота
 * @returns Объект с состоянием и методами для обновления токена
 */
export function useTokenUpdate(): TokenUpdateResult {
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /**
   * Обновление токена бота
   * @param token - Новый токен
   * @param tokenId - ID токена
   * @param projectId - ID проекта
   * @returns true если обновление успешно
   */
  const updateToken = async (token: string, tokenId: number, projectId: number): Promise<boolean> => {
    setIsValidating(true);
    setError(null);

    try {
      // Проверяем валидность токена
      const isValid = await validateBotToken(token);

      if (!isValid) {
        setError('Неверный токен. Пожалуйста, проверьте токен бота.');
        return false;
      }

      // Обновляем токен в системе
      await apiRequest('PUT', `/api/projects/${projectId}/tokens/${tokenId}`, {
        token
      });

      // Останавливаем бота с предыдущим токеном
      await apiRequest('POST', `/api/projects/${projectId}/bot/stop`, {
        tokenId
      });

      // Инвалидируем кэш
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot`] });

      toast({
        title: "Токен обновлен",
        description: "Токен бота успешно изменен"
      });

      return true;
    } catch (err: any) {
      setError(err.message || "Ошибка при обновлении токена");
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Очистка ошибки
   */
  const clearError = () => {
    setError(null);
  };

  return {
    isValidating,
    error,
    updateToken,
    clearError
  };
}
