/**
 * @fileoverview Хук для редактирования токена
 *
 * Управляет состоянием редактирования токена и его валидацией.
 *
 * @module useTokenEdit
 */

import { useState } from 'react';
import { validateBotToken } from './tokenUtils';

/**
 * Результат хука редактирования токена
 */
interface UseTokenEditResult {
  /** Флаг режима редактирования */
  isEditing: boolean;
  /** Текущее значение токена */
  tokenValue: string;
  /** Флаг процесса валидации */
  isValidating: boolean;
  /** Текст ошибки или null */
  error: string | null;
  /** Начать редактирование */
  startEditing: (currentToken: string) => void;
  /** Остановить редактирование */
  stopEditing: () => void;
  /** Установить значение токена */
  setTokenValue: (value: string) => void;
  /** Очистить ошибку */
  clearError: () => void;
  /** Валидировать токен */
  validateToken: (token: string) => Promise<boolean>;
}

/**
 * Хук для редактирования токена
 * @returns Объект с состоянием и методами для редактирования токена
 */
export function useTokenEdit(): UseTokenEditResult {
  const [isEditing, setIsEditing] = useState(false);
  const [tokenValue, setTokenValue] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Начало редактирования
   */
  const startEditing = (currentToken: string) => {
    setIsEditing(true);
    setTokenValue(currentToken);
    setError(null);
  };

  /**
   * Остановка редактирования — сбрасывает isEditing в false
   */
  const stopEditing = () => {
    setIsEditing(false);
    setError(null);
  };

  /**
   * Валидация токена через Telegram API
   */
  const validateToken = async (token: string): Promise<boolean> => {
    setIsValidating(true);
    setError(null);

    const isValid = await validateBotToken(token);

    if (!isValid) {
      setError('Неверный токен. Пожалуйста, проверьте токен бота.');
    }

    setIsValidating(false);
    return isValid;
  };

  return {
    isEditing,
    tokenValue,
    isValidating,
    error,
    startEditing,
    stopEditing,
    setTokenValue,
    clearError: () => setError(null),
    validateToken,
  };
}
