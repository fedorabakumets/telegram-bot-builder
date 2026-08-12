/**
 * @fileoverview Хук остановки большой рассылки (сразу по всем ботам)
 * @module client/components/editor/broadcast/hooks/use-stop-broadcast-campaign
 */

import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import { useToast } from '@/hooks/use-toast';

/**
 * Параметры хука useStopBroadcastCampaign
 */
interface UseStopBroadcastCampaignParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Колбэк для обновления данных после остановки */
  refetch?: () => void;
}

/**
 * Хук остановки большой рассылки через
 * POST /api/projects/:projectId/broadcast-campaigns/:campaignId/stop.
 * Останавливает отправку у всех ботов рассылки.
 *
 * @param params - Параметры хука
 * @returns Мутация остановки большой рассылки
 */
export function useStopBroadcastCampaign({ projectId, refetch }: UseStopBroadcastCampaignParams) {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (campaignId: number) => {
      return apiRequest(
        'POST',
        `/api/projects/${projectId}/broadcast-campaigns/${campaignId}/stop`,
      );
    },
    onSuccess: () => {
      toast({ title: 'Рассылка остановлена', description: 'Отправка остановлена у всех ботов' });
      refetch?.();
    },
    onError: (error: Error) => {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось остановить рассылку',
        variant: 'destructive',
      });
    },
  });
}
