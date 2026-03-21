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

import { apiRequest } from '@/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useTokenEdit } from '../token/useTokenEdit';
import { TokenDisplay } from './TokenDisplay';
import { TokenEditInput } from '../token/TokenEditInput';

/**
 * Свойства компонента отображения и редактирования токена
 */
interface TokenDisplayEditProps {
  /** Текущий токен бота */
  token: string;
  /** ID токена */
  tokenId: number;
  /** ID проекта */
  projectId: number;
  /** Колбэк после успешного обновления токена */
  onTokenUpdate: () => void;
}

/**
 * Компонент для отображения и редактирования токена бота
 */
export function TokenDisplayEdit({ token, tokenId, projectId, onTokenUpdate }: TokenDisplayEditProps) {
  const { isEditing, tokenValue, isValidating, error, startEditing, stopEditing, setTokenValue, validateToken } = useTokenEdit();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /**
   * Обработчик сохранения нового токена
   */
  const handleSave = async () => {
    if (tokenValue === token) {
      stopEditing();
      return;
    }

    const isValid = await validateToken(tokenValue);
    if (!isValid) return;

    try {
      await apiRequest('PUT', `/api/projects/${projectId}/tokens/${tokenId}`, { token: tokenValue });
      await apiRequest('POST', `/api/projects/${projectId}/bot/stop`, { tokenId });

      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot`] });

      toast({ title: 'Токен обновлен', description: 'Токен бота успешно изменён' });

      stopEditing();
      onTokenUpdate();
    } catch (err: any) {
      toast({
        title: 'Ошибка',
        description: err.message || 'Ошибка при обновлении токена',
        variant: 'destructive',
      });
    }
  };

  /**
   * Обработчик отмены редактирования
   */
  const handleCancel = () => {
    setTokenValue(token);
    stopEditing();
  };

  /**
   * Обработчик нажатия клавиш
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSave();
    else if (e.key === 'Escape') handleCancel();
  };

  if (isEditing) {
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

  return <TokenDisplay token={token} onDoubleClick={() => startEditing(token)} />;
}
