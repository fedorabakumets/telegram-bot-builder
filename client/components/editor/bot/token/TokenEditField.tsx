/**
 * @fileoverview Тонкая обёртка для редактирования токена бота
 *
 * Использует useTokenUpdate и TokenEditInput.
 * Предпочтительный компонент — TokenDisplayEdit.
 *
 * @module TokenEditField
 */

import { useState } from 'react';
import { useTokenUpdate } from '../useTokenUpdate';
import { TokenEditInput } from '../TokenEditInput';

/**
 * Свойства компонента редактирования токена
 */
interface TokenEditFieldProps {
  /** Текущий токен */
  currentToken: string;
  /** ID токена */
  tokenId: number;
  /** ID проекта */
  projectId: number;
  /** Колбэк завершения редактирования */
  onComplete: () => void;
}

/**
 * Компонент редактирования токена (обёртка над TokenEditInput + useTokenUpdate)
 */
export function TokenEditField({ currentToken, tokenId, projectId, onComplete }: TokenEditFieldProps) {
  const [tokenValue, setTokenValue] = useState(currentToken);
  const { isValidating, error, updateToken } = useTokenUpdate();

  const handleSave = async () => {
    if (tokenValue === currentToken) { onComplete(); return; }
    const success = await updateToken(tokenValue, tokenId, projectId);
    if (success) onComplete();
  };

  const handleCancel = () => {
    setTokenValue(currentToken);
    onComplete();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSave();
    else if (e.key === 'Escape') handleCancel();
  };

  return (
    <TokenEditInput
      value={tokenValue}
      onChange={setTokenValue}
      onKeyDown={handleKeyDown}
      onSave={handleSave}
      onCancel={handleCancel}
      isValidating={isValidating}
      error={error}
    />
  );
}
