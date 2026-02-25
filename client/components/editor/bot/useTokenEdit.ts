/**
 * @fileoverview Хук для редактирования токена
 *
 * Управляет состоянием редактирования токена и его валидацией.
 *
 * @module useTokenEdit
 */

import { useState } from 'react';
import { validateBotToken } from './tokenUtils';

interface UseTokenEditResult {
  isEditing: boolean;
  tokenValue: string;
  isValidating: boolean;
  error: string | null;
  startEditing: (currentToken: string) => void;
  setTokenValue: (value: string) => void;
  clearError: () => void;
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
   * Валидация токена
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
    setTokenValue,
    clearError: () => setError(null),
    validateToken
  };
}
