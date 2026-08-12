/**
 * @fileoverview Хук редактирования текста большой рассылки сразу во всех ботах
 * @module client/components/editor/broadcast/hooks/use-edit-broadcast-campaign
 */

import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import { useToast } from '@/hooks/use-toast';

/**
 * Параметры хука useEditBroadcastCampaign
 */
interface UseEditBroadcastCampaignParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Колбэк для обновления данных после редактирования */
  refetch?: () => void;
}

/**
 * Аргументы мутации редактирования большой рассылки
 */
interface EditCampaignVariables {
  /** Идентификатор большой рассылки */
  campaignId: number;
  /** Новый HTML-текст сообщения */
  messageText: string;
}

/**
 * Хук редактирования большой рассылки через
 * PUT /api/projects/:projectId/broadcast-campaigns/:campaignId.
 * Текст меняется в уже отправленных сообщениях всех ботов.
 *
 * @param params - Параметры хука
 * @returns Мутация редактирования большой рассылки
 */
export function useEditBroadcastCampaign({ projectId, refetch }: UseEditBroadcastCampaignParams) {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ campaignId, messageText }: EditCampaignVariables) => {
      return apiRequest(
        'PUT',
        `/api/projects/${projectId}/broadcast-campaigns/${campaignId}`,
        { messageText },
      ) as Promise<{ ok: boolean; edited: number; failed: number }>;
    },
    onSuccess: (data) => {
      toast({
        title: 'Текст обновлён',
        description: `Сообщений изменено у получателей: ${data?.edited ?? 0}`,
      });
      refetch?.();
    },
    onError: (error: Error) => {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось изменить текст рассылки',
        variant: 'destructive',
      });
    },
  });
}
