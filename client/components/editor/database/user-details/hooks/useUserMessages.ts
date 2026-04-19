/**
 * @fileoverview Хук загрузки сообщений пользователя
 * @description Загружает сообщения и подсчитывает статистику
 */

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { buildUsersApiUrl } from '@/components/editor/database/utils';
import { BotMessageWithMedia } from '../types';

/**
 * Загружает сообщения пользователя и считает статистику
 * @param projectId - Идентификатор проекта
 * @param userId - Идентификатор пользователя
 * @param selectedTokenId - Идентификатор выбранного токена
 * @returns Сообщения и статистика
 */
export function useUserMessages(
  projectId: number,
  userId: number | undefined,
  selectedTokenId?: number | null
) {
  const requestUrl = buildUsersApiUrl(
    `/api/projects/${projectId}/users/${userId}/messages`,
    selectedTokenId
  );

  const { data: messages = [] } = useQuery<BotMessageWithMedia[]>({
    queryKey: [requestUrl, selectedTokenId, userId],
    enabled: !!userId,
    queryFn: async () => {
      const response = await fetch(requestUrl, { credentials: 'include' });
      return response.json();
    },
    staleTime: 0,
    select: (data) => {
      if (!Array.isArray(data)) {
        return data && typeof data === 'object' ? [data] : [];
      }
      return data;
    },
  });

  const stats = useMemo(() => {
    const userSent = messages.filter((message) => message.messageType === 'user').length;
    const botSent = messages.filter((message) => message.messageType === 'bot').length;
    return { total: messages.length, userSent, botSent };
  }, [messages]);

  return { messages, ...stats };
}
