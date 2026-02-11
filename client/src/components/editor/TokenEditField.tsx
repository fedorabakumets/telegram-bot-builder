/**
 * @fileoverview Компонент для редактирования токена бота
 *
 * Этот компонент предоставляет интерфейс для:
 * - Редактирования токена бота через двойной клик
 * - Валидации токена через Telegram API
 * - Отображения ошибок валидации
 * - Обновления токена в системе
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Свойства компонента редактирования токена
 * @interface TokenEditFieldProps
 */
interface TokenEditFieldProps {
  /** Текущий токен */
  currentToken: string;
  /** ID токена */
  tokenId: number;
  /** ID проекта */
  projectId: number;
  /** Функция для завершения редактирования */
  onComplete: () => void;
}

/**
 * Компонент для редактирования токена бота
 * @param currentToken - Текущий токен
 * @param tokenId - ID токена
 * @param projectId - ID проекта
 * @param onComplete - Функция для завершения редактирования
 * @returns JSX элемент компонента редактирования токена
 */
export function TokenEditField({ currentToken, tokenId, projectId, onComplete }: TokenEditFieldProps) {
  const [tokenValue, setTokenValue] = useState(currentToken);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /**
   * Валидация токена через Telegram API
   * @param token - Токен бота для валидации
   * @returns {Promise<boolean>} - Возвращает true, если токен действителен
   */
  const validateBotToken = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const data = await response.json();
      return data.ok;
    } catch (error) {
      console.error('Ошибка при проверке токена:', error);
      return false;
    }
  };

  /**
   * Обработчик сохранения нового токена
   */
  const handleSave = async () => {
    if (tokenValue === currentToken) {
      onComplete();
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      // Проверяем, является ли новый токен валидным
      const isValid = await validateBotToken(tokenValue);

      if (!isValid) {
        setValidationError('Неверный токен. Пожалуйста, проверьте токен бота.');
        return;
      }

      // Обновить токен в системе
      await apiRequest('PUT', `/api/projects/${projectId}/tokens/${tokenId}`, {
        token: tokenValue
      });

      // Остановить бота с предыдущим токеном
      await apiRequest('POST', `/api/projects/${projectId}/bot/stop`, {
        tokenId: tokenId
      });

      // Инвалидировать кэш
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot`] });

      toast({
        title: "Токен обновлен",
        description: "Токен бота успешно изменен"
      });

      onComplete();
    } catch (error: any) {
      setValidationError(error.message || "Ошибка при обновлении токена");
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Обработчик отмены редактирования
   */
  const handleCancel = () => {
    setTokenValue(currentToken);
    onComplete();
  };

  /**
   * Обработчик нажатия клавиш
   * @param e - Событие клавиатуры
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="w-full space-y-2">
      <Input
        value={tokenValue}
        onChange={(e) => setTokenValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        autoFocus
        className="font-mono text-xs p-2"
        placeholder="Введите токен бота"
        disabled={isValidating}
      />
      {isValidating && (
        <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-spin" />
          Проверка токена...
        </div>
      )}
      {validationError && (
        <div className="text-xs text-red-600 dark:text-red-400">
          {validationError}
        </div>
      )}
    </div>
  );
}