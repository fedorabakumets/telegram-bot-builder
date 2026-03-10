/**
 * @fileoverview Хук загрузки сообщений пользователя
 * @description Загружает сообщения и подсчитывает статистику
 */

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { BotMessageWithMedia } from '../types';

/**
 * Загружает сообщения пользователя и считает статистику
 * @param {number} projectId - Идентификатор проекта
 * @param {number | undefined} userId - Идентификатор пользователя
 * @returns {{ messages: BotMessageWithMedia[], total: number, userSent: number, botSent: number }}
 */
export function useUserMessages(projectId: number, userId: number | undefined) {
  const { data: messages = [] } = useQuery<BotMessageWithMedia[]>({
    queryKey: [`/api/projects/${projectId}/users/${userId}/messages`],
    enabled: !!userId,
    staleTime: 0,
    select: (data) => {
      // Защита: если данные не массив, оборачиваем объект в массив
      if (!Array.isArray(data)) {
        if (data && typeof data === 'object') {
          return [data];
        }
        return [];
      }
      return data;
    },
  });

  const stats = useMemo(() => {
    const userSent = messages.filter(m => m.messageType === 'user').length;
    const botSent = messages.filter(m => m.messageType === 'bot').length;
    return {
      total: messages.length,
      userSent,
      botSent
    };
  }, [messages]);

  return { messages, ...stats };
}
