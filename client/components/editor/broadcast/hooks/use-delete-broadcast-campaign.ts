/**
 * @fileoverview Хук удаления большой рассылки вместе с сообщениями во всех ботах
 * @module client/components/editor/broadcast/hooks/use-delete-broadcast-campaign
 */

import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import { useToast } from '@/hooks/use-toast';

/**
 * Параметры хука useDeleteBroadcastCampaign
 */
interface UseDeleteBroadcastCampaignParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Колбэк для обновления данных после удаления */
  refetch?: () => void;
}

/**
 * Хук удаления большой рассылки через
 * DELETE /api/projects/:projectId/broadcast-campaigns/:campaignId.
 * Сервер удаляет отправленные сообщения у получателей всех ботов.
 *
 * @param params - Параметры хука
 * @returns Мутация удаления большой рассылки
 */
export function useDeleteBroadcastCampaign({ projectId, refetch }: UseDeleteBroadcastCampaignParams) {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (campaignId: number) => {
      return apiRequest(
        'DELETE',
        `/api/projects/${projectId}/broadcast-campaigns/${campaignId}`,
      ) as Promise<{ ok: boolean; deleted: number; broadcasts: number }>;
    },
    onSuccess: (data) => {
      toast({
        title: 'Рассылка удалена',
        description: `Сообщений удалено у получателей: ${data?.deleted ?? 0}`,
      });
      refetch?.();
    },
    onError: (error: Error) => {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось удалить рассылку',
        variant: 'destructive',
      });
    },
  });
}
