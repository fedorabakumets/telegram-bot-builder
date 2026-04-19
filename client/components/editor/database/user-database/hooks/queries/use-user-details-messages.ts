/**
 * @fileoverview Хук для загрузки сообщений пользователя
 * @description Получает историю сообщений для панели деталей пользователя
 */

import { useQuery } from '@tanstack/react-query';
import { buildUsersApiUrl } from '@/components/editor/database/utils';
import { BotMessageWithMedia } from '../../types';

/**
 * Параметры хука useUserDetailsMessages
 */
interface UseUserDetailsMessagesParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
  /** ID пользователя */
  userId?: string;
  /** Флаг открытия деталей */
  enabled: boolean;
}

/**
 * Хук для загрузки сообщений пользователя
 * @param params - Параметры хука
 * @returns Сообщения пользователя
 */
export function useUserDetailsMessages(params: UseUserDetailsMessagesParams) {
  const { projectId, selectedTokenId, userId, enabled } = params;
  const requestUrl = buildUsersApiUrl(
    `/api/projects/${projectId}/users/${userId}/messages`,
    selectedTokenId
  );

  const { data: userDetailsMessages = [] } = useQuery<BotMessageWithMedia[]>({
    queryKey: [requestUrl, selectedTokenId, userId],
    enabled: enabled && !!userId,
    queryFn: async () => {
      const response = await fetch(requestUrl, { credentials: 'include' });
      return response.json();
    },
    staleTime: 0,
  });

  return { userDetailsMessages };
}
