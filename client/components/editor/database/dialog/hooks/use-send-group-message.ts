/**
 * @fileoverview Хук отправки сообщения в группу через Telegram Bot API
 * @module editor/database/dialog/hooks/use-send-group-message
 */

import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/queryClient';

/**
 * Параметры хука useSendGroupMessage
 */
interface UseSendGroupMessageParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Telegram chat_id группы */
  groupId?: string | null;
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
  onSent,
}: UseSendGroupMessageParams) {
  const { toast } = useToast();

  return useMutation({
    /**
     * Отправляет сообщение в группу
     * @param messageText - Текст сообщения
     */
    mutationFn: async ({ messageText }: { messageText: string }) => {
      if (!groupId) throw new Error('Не указан ID группы');
      return apiRequest('POST', `/api/projects/${projectId}/bot/send-group-message`, {
        groupId,
        message: messageText,
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
