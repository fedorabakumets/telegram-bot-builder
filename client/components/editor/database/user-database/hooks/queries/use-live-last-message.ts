/**
 * @fileoverview Хук real-time обновления последнего сообщения пользователя.
 * Подписывается на единый WS-контекст панели (UserMessagesLiveProvider),
 * не создаёт собственного соединения.
 * @module client/components/editor/database/user-database/hooks/queries/use-live-last-message
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { buildUsersApiUrl } from '@/components/editor/database/utils';
import { useUserMessagesLiveContext } from '../../contexts/user-messages-live-context';
import { BotMessageWithMedia } from '../../types';

/**
 * Формирует ключ кэша React Query для useLastMessage
 * @param projectId - Идентификатор проекта
 * @param userId - Идентификатор пользователя
 * @param selectedTokenId - Идентификатор выбранного токена
 * @returns Массив-ключ кэша
 */
function buildLastMessageQueryKey(
  projectId: number,
  userId: number,
  selectedTokenId?: number | null,
): unknown[] {
  const requestUrl = buildUsersApiUrl(
    `/api/projects/${projectId}/users/${userId}/messages`,
    selectedTokenId,
    { limit: '1', order: 'desc', messageType: 'user' },
  );
  return [requestUrl, selectedTokenId, userId, 'last-user'];
}

/**
 * Хук real-time обновления последнего сообщения пользователя в кэше React Query.
 * Использует единое WS-соединение из UserMessagesLiveProvider — не создаёт своё.
 * Обновляет кэш только при событиях messageType === 'user'.
 *
 * @param projectId - Идентификатор проекта
 * @param userId - Идентификатор пользователя (число)
 * @param selectedTokenId - Идентификатор выбранного токена
 * @returns null
 */
export function useLiveLastMessage(
  projectId: number,
  userId?: number | null,
  selectedTokenId?: number | null,
): null {
  const queryClient = useQueryClient();
  const liveContext = useUserMessagesLiveContext();

  useEffect(() => {
    if (!userId || !liveContext) return;

    const userIdStr = String(userId);

    const unsubscribe = liveContext.subscribe((msg) => {
      if (msg.type !== 'new-message' || msg.projectId !== projectId) return;
      if (selectedTokenId && msg.tokenId !== selectedTokenId) return;
      if (String(msg.data.userId) !== userIdStr) return;
      if (msg.data.messageType !== 'user') return;

      const newMessage: BotMessageWithMedia = {
        id: msg.data.id,
        projectId,
        tokenId: selectedTokenId ?? msg.tokenId ?? 0,
        userId: msg.data.userId,
        messageType: msg.data.messageType,
        messageText: msg.data.messageText ?? null,
        messageData: msg.data.messageData ?? {},
        nodeId: msg.data.nodeId ?? null,
        primaryMediaId: null,
        chatId: msg.data.chatId ?? null,
        chatType: msg.data.chatType ?? 'private',
        telegramMessageId: null,
        createdAt: new Date(msg.data.createdAt),
        media: [],
      };

      const queryKey = buildLastMessageQueryKey(projectId, userId, selectedTokenId);
      queryClient.setQueryData<BotMessageWithMedia | null>(queryKey, newMessage);
    });

    return unsubscribe;
  }, [projectId, userId, selectedTokenId, queryClient, liveContext]);

  return null;
}
