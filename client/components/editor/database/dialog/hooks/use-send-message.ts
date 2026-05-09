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
    mutationFn: async ({
      messageText,
      mediaUrls = [],
    }: {
      /** Текст сообщения */
      messageText: string;
      /** Массив URL медиафайлов (опционально) */
      mediaUrls?: string[];
    }) => {
      if (!userId) {
        throw new Error('No user selected');
      }

      return apiRequest(
        'POST',
        buildUsersApiUrl(`/api/projects/${projectId}/users/${userId}/send-message`, selectedTokenId),
        { messageText, mediaUrls }
      );
    },

    onMutate: ({ messageText, mediaUrls = [] }) => {
      // Генерируем временный отрицательный id, чтобы не конфликтовать с реальными id из БД
      const tempId = Date.now() * -1;
      tempIdRef.current = tempId;

      /** Данные медиа для оптимистичного отображения — первый файл из списка */
      const mediaMessageData: Record<string, unknown> = {};
      if (mediaUrls.length > 0) {
        const firstUrl = mediaUrls[0];
        // Определяем тип по расширению для немедленного отображения
        const ext = firstUrl.split('.').pop()?.toLowerCase() ?? '';
        const isPhoto = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
        const isVideo = ['mp4', 'avi', 'mov', 'webm'].includes(ext);
        const isAudio = ['mp3', 'wav', 'ogg', 'm4a'].includes(ext);
        const mediaType = isPhoto ? 'photo' : isVideo ? 'video' : isAudio ? 'audio' : 'document';
        mediaMessageData.broadcastMediaUrl = firstUrl;
        mediaMessageData.broadcastMediaType = mediaType;
      }

      const optimisticMsg: BotMessageWithMedia = {
        id: tempId,
        projectId,
        tokenId: selectedTokenId ?? 0,
        userId: userIdStr ?? String(userId ?? ''),
        messageType: 'bot',
        messageText,
        messageData: mediaMessageData,
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
      onSent?.();
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
