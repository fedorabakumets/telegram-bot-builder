/**
 * @fileoverview Компонент для редактирования токена бота
 *
 * Предоставляет интерфейс для редактирования токена через двойной клик
 * с валидацией через Telegram API.
 *
 * @module TokenEditField
 */

import { useState } from 'react';
import { useTokenUpdate } from './useTokenUpdate';
import { TokenInputField } from './TokenInputField';

interface TokenEditFieldProps {
  currentToken: string;
  tokenId: number;
  projectId: number;
  onComplete: () => void;
}

/**
 * Компонент для редактирования токена бота
 */
export function TokenEditField({ currentToken, tokenId, projectId, onComplete }: TokenEditFieldProps) {
  const [tokenValue, setTokenValue] = useState(currentToken);
  const { isValidating, error, updateToken } = useTokenUpdate();

  /**
   * Обработчик сохранения нового токена
   */
  const handleSave = async () => {
    if (tokenValue === currentToken) {
      onComplete();
      return;
    }

    const success = await updateToken(tokenValue, tokenId, projectId);

    if (success) {
      onComplete();
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
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <TokenInputField
      value={tokenValue}
      onChange={setTokenValue}
      onKeyDown={handleKeyDown}
      onBlur={handleSave}
      isValidating={isValidating}
      error={error}
    />
  );
}
