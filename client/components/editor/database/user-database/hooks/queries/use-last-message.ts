/**
 * @fileoverview Хук загрузки последнего сообщения пользователя
 * Загружает последнее сообщение из диалога с пользователем
 */

import { useQuery } from '@tanstack/react-query';
import { BotMessageWithMedia } from '../../types';

/**
 * Хук для загрузки последнего сообщения пользователя
 * @param projectId - Идентификатор проекта
 * @param userId - Идентификатор пользователя
 * @returns Последнее сообщение и состояние загрузки
 */
export function useLastMessage(projectId: number, userId?: number) {
  return useQuery<BotMessageWithMedia | null>({
    queryKey: [`/api/projects/${projectId}/users/${userId}/messages/last`],
    enabled: !!userId,
    staleTime: 30000, // 30 секунд
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/users/${userId}/messages?limit=1`);
      if (!response.ok) return null;
      const messages = await response.json();
      return messages[0] || null;
    },
  });
}
