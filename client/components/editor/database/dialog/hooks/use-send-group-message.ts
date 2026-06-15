/**
 * @fileoverview Хук отправки сообщения в группу через Telegram Bot API
 * @module editor/database/dialog/hooks/use-send-group-message
 */

import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/queryClient';
import { buildUsersApiUrl } from '@/components/editor/database/utils';
import type { Button } from '@shared/schema';

/**
 * Параметры хука useSendGroupMessage
 */
interface UseSendGroupMessageParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Telegram chat_id группы */
  groupId?: string | null;
  /** Идентификатор выбранного в шапке диалога токена бота */
  selectedTokenId?: number | null;
  /** Колбэк после успешной отправки */
  onSent?: () => void;
}

/**
 * Хук отправки сообщения в группу через POST /api/projects/:projectId/bot/send-group-message
 * @param params - Параметры хука
 * @returns Мутация отправки сообщения в группу
 */
export function useSendGroupMessage({
  projectId,
  groupId,
  selectedTokenId,
  onSent,
}: UseSendGroupMessageParams) {
  const { toast } = useToast();

  return useMutation({
    /**
     * Отправляет сообщение в группу
     * @param messageText - Текст сообщения
     * @param mediaUrls - Массив URL медиафайлов (опционально)
     * @param buttons - Массив инлайн-кнопок сообщения (опционально, бэкенд подключит позже)
     */
    mutationFn: async ({ messageText, mediaUrls, buttons }: { messageText: string; mediaUrls?: string[]; buttons?: Button[] }) => {
      if (!groupId) throw new Error('Не указан ID группы');
      // Добавляем tokenId выбранного бота, чтобы сообщение ушло от него, а не от бота по умолчанию
      const url = buildUsersApiUrl(
        `/api/projects/${projectId}/bot/send-group-message`,
        selectedTokenId
      );
      return apiRequest('POST', url, {
        groupId,
        message: messageText,
        mediaUrls: mediaUrls ?? [],
        buttons: buttons ?? [],
      });
    },

    onSuccess: () => {
      toast({
        title: 'Сообщение отправлено',
        description: 'Сообщение успешно отправлено в группу',
      });
      onSent?.();
    },

    onError: () => {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение в группу',
        variant: 'destructive',
      });
    },
  });
}
