/**
 * @fileoverview Компонент для отображения и редактирования токена бота
 *
 * Предоставляет интерфейс для:
 * - Отображения маскированного токена
 * - Редактирования токена по двойному клику
 * - Валидации токена через Telegram API
 * - Обновления токена в системе
 *
 * @module TokenDisplayEdit
 */

import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useTokenEdit } from './useTokenEdit';
import { TokenDisplay } from './TokenDisplay';
import { TokenEditInput } from './TokenEditInput';

interface TokenDisplayEditProps {
  token: string;
  tokenId: number;
  projectId: number;
  onTokenUpdate: () => void;
}

/**
 * Компонент для отображения и редактирования токена бота
 */
export function TokenDisplayEdit({ token, tokenId, projectId, onTokenUpdate }: TokenDisplayEditProps) {
  const { isEditing, tokenValue, isValidating, error, startEditing, setTokenValue, validateToken } = useTokenEdit();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /**
   * Обработчик сохранения нового токена
   */
  const handleSave = async () => {
    if (tokenValue === token) {
      return;
    }

    const isValid = await validateToken(tokenValue);

    if (!isValid) {
      return;
    }

    try {
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

      onTokenUpdate();
    } catch (err: any) {
      toast({
        title: "Ошибка",
        description: err.message || "Ошибка при обновлении токена",
        variant: "destructive"
      });
    }
  };

  /**
   * Обработчик отмены редактирования
   */
  const handleCancel = () => {
    setTokenValue(token);
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

  if (isEditing) {
    return (
      <TokenEditInput
        value={tokenValue}
        onChange={setTokenValue}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        isValidating={isValidating}
        error={error}
      />
    );
  }

  return <TokenDisplay token={token} onDoubleClick={() => startEditing(token)} />;
}
