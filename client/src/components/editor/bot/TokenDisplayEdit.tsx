/**
 * @fileoverview Компонент для отображения и редактирования токена бота
 *
 * Этот компонент предоставляет интерфейс для:
 * - Отображения маскированного токена
 * - Редактирования токена по двойному клику
 * - Валидации токена через Telegram API
 * - Обновления токена в системе
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Свойства компонента отображения и редактирования токена
 * @interface TokenDisplayEditProps
 */
interface TokenDisplayEditProps {
  /** Текущий токен */
  token: string;
  /** ID токена */
  tokenId: number;
  /** ID проекта */
  projectId: number;
  /** Функция для обновления информации о боте */
  onTokenUpdate: () => void;
}

/**
 * Компонент для отображения и редактирования токена бота
 * @param token - Текущий токен
 * @param tokenId - ID токена
 * @param projectId - ID проекта
 * @param onTokenUpdate - Функция для обновления информации о боте
 * @returns JSX элемент компонента отображения и редактирования токена
 */
export function TokenDisplayEdit({ token, tokenId, projectId, onTokenUpdate }: TokenDisplayEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tokenValue, setTokenValue] = useState(token);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /**
   * Маскировка токена (показываем только последние 4 символа)
   * @param token - Токен для маскировки
   * @returns {string} - Маскированный токен
   */
  const maskToken = (token: string): string => {
    if (token.length <= 4) {
      return token;
    }
    return '*'.repeat(token.length - 4) + token.slice(-4);
  };

  /**
   * Валидация токена через Telegram API
   * @param token - Токен бота для валидации
   * @returns {Promise<boolean>} - Возвращает true, если токен действителен
   */
  const validateBotToken = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);

      // Проверяем статус ответа
      if (!response.ok) {
        console.error(`Ошибка HTTP: ${response.status} ${response.statusText}`);
        return false;
      }

      // Получаем текст ответа
      const responseText = await response.text();

      // Проверяем, начинается ли ответ с JSON объекта
      if (!responseText.trim().startsWith('{')) {
        console.error('Ответ не является JSON:', responseText);
        return false;
      }

      try {
        const data = JSON.parse(responseText);
        return data.ok;
      } catch (jsonError) {
        console.error('Ошибка парсинга JSON:', jsonError);
        return false;
      }
    } catch (error) {
      console.error('Ошибка при проверке токена:', error);
      return false;
    }
  };

  /**
   * Обработчик двойного клика для начала редактирования
   */
  const handleDoubleClick = () => {
    setIsEditing(true);
    setTokenValue(token); // Устанавливаем полный токен для редактирования
    setValidationError(null);
  };

  /**
   * Обработчик сохранения нового токена
   */
  const handleSave = async () => {
    if (tokenValue === token) {
      setIsEditing(false);
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

      setIsEditing(false);
      onTokenUpdate(); // Вызываем колбэк для обновления информации
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
    setTokenValue(token);
    setIsEditing(false);
    setValidationError(null);
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
    <div className="w-full">
      {isEditing ? (
        <div className="space-y-2">
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
      ) : (
        <p
          className="text-xs text-muted-foreground cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors break-all"
          onDoubleClick={handleDoubleClick}
          title="Double-click to edit token"
        >
          Токен: {maskToken(token)}
        </p>
      )}
    </div>
  );
}