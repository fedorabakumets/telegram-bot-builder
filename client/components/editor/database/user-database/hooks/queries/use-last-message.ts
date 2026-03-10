/**
 * Хук для загрузки последнего сообщения пользователя
 * Загружает последнее сообщение от пользователя (которое пользователь написал боту)
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
    queryKey: [`/api/projects/${projectId}/users/${userId}/messages/last-user`],
    enabled: !!userId,
    staleTime: 5000, // 5 секунд
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      // Запрашиваем последнее сообщение ОТ ПОЛЬЗОВАТЕЛЯ (messageType=user)
      const url = `/api/projects/${projectId}/users/${userId}/messages?limit=1&order=desc&messageType=user`;
      console.log('[useLastMessage] Fetching:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error('[useLastMessage] Response not ok:', response.status);
        return null;
      }
      
      const messages = await response.json();
      console.log('[useLastMessage] Response:', messages);
      
      // Защита: проверяем, что messages — массив
      if (!Array.isArray(messages) || messages.length === 0) {
        console.log('[useLastMessage] No messages found');
        return null;
      }
      
      const message = messages[0];
      console.log('[useLastMessage] Last message:', message);
      
      // Защита: проверяем, что message — объект
      if (!message || typeof message !== 'object') return null;
      return message;
    },
  });
}
