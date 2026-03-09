/**
 * @fileoverview Хук загрузки сообщений диалога
 * Управляет загрузкой и автопрокруткой сообщений
 */

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BotMessageWithMedia } from '../types';

/**
 * Хук для загрузки сообщений пользователя
 * @param projectId - Идентификатор проекта
 * @param userId - Идентификатор пользователя
 * @returns Объект с сообщениями и состоянием загрузки
 */
export function useDialogMessages(projectId: number, userId?: number) {
  const messagesScrollRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery<BotMessageWithMedia[]>({
    queryKey: [`/api/projects/${projectId}/users/${userId}/messages`],
    enabled: !!userId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  /** Автопрокрутка к последнему сообщению */
  useEffect(() => {
    if (!isLoading && messages.length > 0 && messagesScrollRef.current) {
      setTimeout(() => {
        const viewport = messagesScrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
      }, 100);
    }
  }, [isLoading, messages.length, userId]);

  return { messages, isLoading, messagesScrollRef };
}
