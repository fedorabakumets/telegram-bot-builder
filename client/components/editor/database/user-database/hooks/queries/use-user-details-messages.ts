/**
 * @fileoverview Хук для загрузки сообщений пользователя
 * @description Получает историю сообщений для панели деталей пользователя
 */

import { useQuery } from '@tanstack/react-query';
import { BotMessageWithMedia } from '../../types';

/**
 * Параметры хука useUserDetailsMessages
 */
interface UseUserDetailsMessagesParams {
  /** Идентификатор проекта */
  projectId: number;
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
  const { projectId, userId, enabled } = params;

  const { data: userDetailsMessages = [] } = useQuery<BotMessageWithMedia[]>({
    queryKey: [`/api/projects/${projectId}/users/${userId}/messages`],
    enabled: enabled && !!userId,
    staleTime: 0,
  });

  return { userDetailsMessages };
}
