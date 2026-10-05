/**
 * @fileoverview Хуки раздела «Поддержка» в панели управления
 * @module components/admin/hooks/use-admin-support
 */

import { createContext, useContext } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AdminSupportThreadListItem,
  AdminSupportThreadResponse,
  SupportMessageDto,
  SupportThreadDto,
  SupportThreadStatus,
} from '@shared/support/support.types';
import { apiRequest } from '@/queryClient';
import {
  postSupportMessage,
  type SupportComposerPayload,
} from '@/components/support/post-support-message';

/** Фильтр списка диалогов */
export type AdminSupportFilter = SupportThreadStatus | 'all';

/** Запасной опрос, пока сокет админки не открыт */
const FALLBACK_POLL_MS = 30_000;

/** Корневой ключ кеша поддержки в админке */
export const ADMIN_SUPPORT_QUERY_KEY = ['/admin/api/support'] as const;

/** Сокет каркаса админки: true — опрос списков не нужен */
export const AdminSupportSocketContext = createContext(false);

/**
 * Интервал опроса: выключен, пока сокет в каркасе админки открыт
 * @returns Миллисекунды или false
 */
function useSupportPollInterval(): number | false {
  return useContext(AdminSupportSocketContext) ? false : FALLBACK_POLL_MS;
}

/**
 * Загружает список диалогов
 * @param filter - Фильтр по статусу
 * @returns Запрос списка
 */
export function useAdminSupportThreads(filter: AdminSupportFilter) {
  const pollInterval = useSupportPollInterval();
  return useQuery<{ items: AdminSupportThreadListItem[] }>({
    queryKey: [...ADMIN_SUPPORT_QUERY_KEY, 'threads', filter],
    queryFn: () => apiRequest('GET', `/admin/api/support/threads?status=${filter}`),
    refetchInterval: pollInterval,
  });
}

/**
 * Загружает количество непрочитанных сообщений для бейджа в меню
 * @returns Запрос счётчика
 */
export function useAdminSupportUnread() {
  const pollInterval = useSupportPollInterval();
  return useQuery<{ total: number }>({
    queryKey: [...ADMIN_SUPPORT_QUERY_KEY, 'unread'],
    queryFn: () => apiRequest('GET', '/admin/api/support/unread'),
    refetchInterval: pollInterval,
  });
}

/**
 * Загружает один диалог с сообщениями
 * @param threadId - Идентификатор диалога или null
 * @returns Запрос диалога
 */
export function useAdminSupportThread(threadId: number | null) {
  const pollInterval = useSupportPollInterval();
  return useQuery<AdminSupportThreadResponse>({
    queryKey: [...ADMIN_SUPPORT_QUERY_KEY, 'thread', threadId],
    queryFn: () => apiRequest('GET', `/admin/api/support/threads/${threadId}`),
    enabled: threadId != null,
    refetchInterval: pollInterval,
  });
}

/**
 * Действия над диалогом: ответ, прочтение, смена статуса.
 * После каждого действия обновляет весь кеш поддержки.
 * @param threadId - Идентификатор диалога
 * @returns Мутации диалога
 */
export function useAdminSupportActions(threadId: number) {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: [...ADMIN_SUPPORT_QUERY_KEY] });

  const reply = useMutation<SupportMessageDto, Error, SupportComposerPayload>({
    mutationFn: (payload) =>
      postSupportMessage(`/admin/api/support/threads/${threadId}/messages`, payload),
    onSuccess: refresh,
  });

  const markRead = useMutation<SupportThreadDto, Error, void>({
    mutationFn: () => apiRequest('POST', `/admin/api/support/threads/${threadId}/read`),
    onSuccess: refresh,
  });

  const setStatus = useMutation<SupportThreadDto, Error, SupportThreadStatus>({
    mutationFn: (status) =>
      apiRequest('PATCH', `/admin/api/support/threads/${threadId}`, { status }),
    onSuccess: refresh,
  });

  return { reply, markRead, setStatus };
}
