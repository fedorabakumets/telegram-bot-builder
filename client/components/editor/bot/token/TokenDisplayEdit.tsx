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
import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useTokenEdit } from '../token/useTokenEdit';
import { TokenDisplay } from './TokenDisplay';
import { TokenEditInput } from '../token/TokenEditInput';
import { invalidateBotStatusQueries } from '../invalidate-bot-status-queries';

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
  /** Скрыть префикс «Токен:» в режиме просмотра */
  hidePrefix?: boolean;
}

/**
 * Компонент для отображения и редактирования токена бота
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function TokenDisplayEdit({
  token,
  tokenId,
  projectId,
  onTokenUpdate,
  hidePrefix = false,
}: TokenDisplayEditProps) {
  const { isEditing, tokenValue, isValidating, error, startEditing, stopEditing, setTokenValue, validateToken } = useTokenEdit();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const revealRequest = useRef<AbortController | null>(null);
  const originalToken = useRef('');

  /** Отменяет раскрытие при смене бота или закрытии карточки. */
  useEffect(() => () => {
    revealRequest.current?.abort();
    revealRequest.current = null;
    originalToken.current = '';
  }, [projectId, tokenId]);

  /** Загружает секрет только при явном открытии редактора. */
  const handleEdit = async () => {
    if (revealRequest.current) return;
    const request = new AbortController();
    revealRequest.current = request;
    try {
      const response = await fetch(`/api/projects/${projectId}/tokens/${tokenId}/reveal`, {
        signal: request.signal, cache: 'no-store',
      });
      if (!response.ok) throw new Error('Токен недоступен');
      const { value } = await response.json() as { /** Полный сохранённый токен. */ value: string };
      if (request.signal.aborted) return;
      originalToken.current = value;
      startEditing(value);
    } catch {
      if (request.signal.aborted) return;
      toast({ title: 'Не удалось показать текущий токен', description: 'В поле можно ввести новый токен.' });
      startEditing('');
    } finally {
      if (revealRequest.current === request) revealRequest.current = null;
    }
  };

  /**
   * Обработчик сохранения нового токена
   */
  const handleSave = async () => {
    if (!tokenValue.trim()) return;
    if (tokenValue === token || tokenValue === originalToken.current) {
      originalToken.current = '';
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
      invalidateBotStatusQueries(queryClient, projectId, tokenId);

      toast({ title: 'Токен обновлен', description: 'Токен бота успешно изменён' });

      originalToken.current = '';
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
    originalToken.current = '';
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

  return (
    <TokenDisplay
      token={token}
      hidePrefix={hidePrefix}
      onEdit={handleEdit}
    />
  );
}
