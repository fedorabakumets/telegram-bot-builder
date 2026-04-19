/**
 * @fileoverview Хук для загрузки сообщений диалога
 * @description Получает историю сообщений для выбранного токена
 */

import { useQuery } from '@tanstack/react-query';
import { buildUsersApiUrl } from '@/components/editor/database/utils';
import { BotMessageWithMedia } from '../../types';

/**
 * Параметры хука useDialogMessages
 */
interface UseDialogMessagesParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
  /** ID пользователя для диалога */
  userId?: string;
  /** Флаг открытия диалога */
  enabled: boolean;
}

/**
 * Хук для загрузки сообщений диалога
 * @param params - Параметры хука
 * @returns Сообщения и состояние загрузки
 */
export function useDialogMessages(params: UseDialogMessagesParams) {
  const { projectId, selectedTokenId, userId, enabled } = params;
  const requestUrl = buildUsersApiUrl(
    `/api/projects/${projectId}/users/${userId}/messages`,
    selectedTokenId
  );

  const {
    data: messages = [],
    isLoading,
    refetch,
  } = useQuery<BotMessageWithMedia[]>({
    queryKey: [requestUrl, selectedTokenId, userId],
    enabled: enabled && !!userId,
    queryFn: async () => {
      const response = await fetch(requestUrl, { credentials: 'include' });
      return response.json();
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  return {
    messages,
    isMessagesLoading: isLoading,
    refetchMessages: refetch,
  };
}
