/**
 * @fileoverview Хук для загрузки сообщений диалога
 * @description Получает историю сообщений для диалога с пользователем
 */

import { useQuery } from '@tanstack/react-query';
import { BotMessageWithMedia } from '../../types';

/**
 * Параметры хука useDialogMessages
 */
interface UseDialogMessagesParams {
  /** Идентификатор проекта */
  projectId: number;
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
  const { projectId, userId, enabled } = params;

  const {
    data: messages = [],
    isLoading,
    refetch,
  } = useQuery<BotMessageWithMedia[]>({
    queryKey: [`/api/projects/${projectId}/users/${userId}/messages`],
    enabled: enabled && !!userId,
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
