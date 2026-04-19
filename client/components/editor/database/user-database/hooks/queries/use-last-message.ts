/**
 * @fileoverview Хук для загрузки последнего сообщения пользователя
 */

import { useQuery } from '@tanstack/react-query';
import { buildUsersApiUrl } from '@/components/editor/database/utils';
import { BotMessageWithMedia } from '../../types';

/**
 * Хук для загрузки последнего сообщения пользователя
 * @param projectId - Идентификатор проекта
 * @param userId - Идентификатор пользователя
 * @param selectedTokenId - Идентификатор выбранного токена
 * @returns Последнее сообщение и состояние загрузки
 */
export function useLastMessage(
  projectId: number,
  userId?: number,
  selectedTokenId?: number | null
) {
  const requestUrl = buildUsersApiUrl(
    `/api/projects/${projectId}/users/${userId}/messages`,
    selectedTokenId,
    { limit: '1', order: 'desc', messageType: 'user' }
  );

  return useQuery<BotMessageWithMedia | null>({
    queryKey: [requestUrl, selectedTokenId, userId, 'last-user'],
    enabled: !!userId,
    staleTime: 5000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const response = await fetch(requestUrl, { credentials: 'include' });
      if (!response.ok) {
        return null;
      }

      const messages = await response.json();
      if (!Array.isArray(messages) || messages.length === 0) {
        return null;
      }

      const message = messages[0];
      return message && typeof message === 'object' ? message : null;
    },
  });
}
