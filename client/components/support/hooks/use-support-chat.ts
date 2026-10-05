/**
 * @fileoverview Хуки чата поддержки пользователя: загрузка, отправка, прочтение
 * @module components/support/hooks/use-support-chat
 */

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  SupportMessageContext,
  SupportMessageDto,
  UserSupportThreadResponse,
} from '@shared/support/support.types';
import { apiRequest } from '@/queryClient';
import { postSupportMessage, type SupportComposerPayload } from '../post-support-message';

/** Ключ кеша диалога поддержки */
export const SUPPORT_THREAD_QUERY_KEY = ['/api/support/thread'];

/** Запасной опрос, пока сокет не открыт */
const FALLBACK_POLL_MS = 30_000;

/**
 * Загружает свой диалог поддержки.
 * Пока сокет жив, опрос не идёт: обновление приходит событием.
 * @param enabled - Пользователь авторизован через Telegram
 * @param socketConnected - Открыт ли WebSocket поддержки
 * @returns Запрос диалога
 */
export function useSupportThread(enabled: boolean, socketConnected: boolean) {
  return useQuery<UserSupportThreadResponse>({
    queryKey: SUPPORT_THREAD_QUERY_KEY,
    queryFn: () => apiRequest('GET', '/api/support/thread'),
    enabled,
    refetchInterval: socketConnected ? false : FALLBACK_POLL_MS,
  });
}

/**
 * Собирает контекст отправки из текущей страницы
 * @returns Проект, путь и браузер
 */
function buildSupportContext(): SupportMessageContext {
  const path = window.location.pathname;
  const match = path.match(/^\/(?:editor|projects)\/(\d+)/);
  return {
    projectId: match ? Number(match[1]) : null,
    path,
    userAgent: navigator.userAgent.slice(0, 500),
  };
}

/**
 * Отправляет сообщение в поддержку и обновляет диалог
 * @returns Мутация отправки
 */
export function useSendSupportMessage() {
  const queryClient = useQueryClient();
  return useMutation<SupportMessageDto, Error, SupportComposerPayload>({
    mutationFn: (payload) =>
      postSupportMessage('/api/support/messages', payload, buildSupportContext()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SUPPORT_THREAD_QUERY_KEY }),
  });
}

/**
 * Отмечает ответы прочитанными, пока панель открыта и есть непрочитанное
 * @param isOpen - Открыта ли панель чата
 * @param unread - Количество непрочитанных ответов
 */
export function useMarkSupportRead(isOpen: boolean, unread: number) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isOpen || unread === 0) return;
    apiRequest('POST', '/api/support/read')
      .then(() => queryClient.invalidateQueries({ queryKey: SUPPORT_THREAD_QUERY_KEY }))
      .catch(() => undefined);
  }, [isOpen, unread, queryClient]);
}
