/**
 * @fileoverview Хук отправки сообщения пользователю с оптимистичным обновлением UI
 * @description Управляет мутацией отправки, добавляет оптимистичное сообщение мгновенно,
 * откатывает его при ошибке и запускает refetch с задержкой после успеха.
 */

import { useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { buildUsersApiUrl } from '@/components/editor/database/utils';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/queryClient';
import { BotMessageWithMedia } from '../types';

/** Задержка перед refetch после успешной отправки (мс), чтобы дать WS доставить реальное сообщение */
const REFETCH_DELAY_MS = 1500;

/**
 * Параметры хука useSendMessage
 */
interface UseSendMessageParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена */
  selectedTokenId?: number | null;
  /** Идентификатор пользователя */
  userId?: number;
  /** Идентификатор пользователя в виде строки (для поля userId в сообщении) */
  userIdStr?: string;
  /** Колбэк после успешной отправки (refetch) */
  onSent?: () => void;
  /** Добавляет оптимистичное сообщение в список live-сообщений */
  addOptimisticMessage: (msg: BotMessageWithMedia) => void;
  /** Удаляет оптимистичное сообщение по временному id */
  removeOptimisticMessage: (tempId: number) => void;
}

/**
 * Хук для отправки сообщения пользователю с оптимистичным обновлением UI.
 * При вызове mutate — мгновенно добавляет сообщение в список.
 * При ошибке — откатывает оптимистичное сообщение.
 * При успехе — запускает refetch с задержкой.
 *
 * @param params - Параметры хука
 * @returns Мутация отправки сообщения
 */
export function useSendMessage({
  projectId,
  selectedTokenId,
  userId,
  userIdStr,
  onSent,
  addOptimisticMessage,
  removeOptimisticMessage,
}: UseSendMessageParams) {
  const { toast } = useToast();
  /** Хранит временный id последнего оптимистичного сообщения */
  const tempIdRef = useRef<number | null>(null);

  return useMutation({
    mutationFn: async ({ messageText }: { messageText: string }) => {
      if (!userId) {
        throw new Error('No user selected');
      }

      return apiRequest(
        'POST',
        buildUsersApiUrl(`/api/projects/${projectId}/users/${userId}/send-message`, selectedTokenId),
        { messageText }
      );
    },

    onMutate: ({ messageText }) => {
      // Генерируем временный отрицательный id, чтобы не конфликтовать с реальными id из БД
      const tempId = Date.now() * -1;
      tempIdRef.current = tempId;

      const optimisticMsg: BotMessageWithMedia = {
        id: tempId,
        projectId,
        tokenId: selectedTokenId ?? 0,
        userId: userIdStr ?? String(userId ?? ''),
        messageType: 'bot',
        messageText,
        messageData: {},
        nodeId: null,
        primaryMediaId: null,
        createdAt: new Date(),
        media: [],
      };

      addOptimisticMessage(optimisticMsg);
    },

    onSuccess: () => {
      toast({
        title: 'Сообщение отправлено',
        description: 'Сообщение успешно отправлено пользователю',
      });
      // Задержка перед refetch — даём WS время доставить реальное сообщение
      setTimeout(() => {
        onSent?.();
      }, REFETCH_DELAY_MS);
    },

    onError: () => {
      // Откатываем оптимистичное сообщение при ошибке
      if (tempIdRef.current !== null) {
        removeOptimisticMessage(tempIdRef.current);
        tempIdRef.current = null;
      }
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
        variant: 'destructive',
      });
    },
  });
}
