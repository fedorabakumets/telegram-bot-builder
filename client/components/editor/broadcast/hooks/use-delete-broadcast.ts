/**
 * @fileoverview Хук удаления одной рассылки (в том числе дочерней у большого рассыла)
 * @module client/components/editor/broadcast/hooks/use-delete-broadcast
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import { useToast } from '@/hooks/use-toast';

/**
 * Параметры хука useDeleteBroadcast
 */
interface UseDeleteBroadcastParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Колбэк обновления ленты и деталей после удаления */
  refetch?: () => void;
}

/**
 * Хук удаления рассылки через DELETE /api/projects/:projectId/broadcasts/:broadcastId.
 * Сервер удаляет сообщения у получателей в Telegram, затем запись рассылки.
 *
 * @param params - Параметры хука
 * @returns Мутация удаления рассылки
 */
export function useDeleteBroadcast({ projectId, refetch }: UseDeleteBroadcastParams) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (broadcastId: number) => {
      return apiRequest(
        'DELETE',
        `/api/projects/${projectId}/broadcasts/${broadcastId}`,
      ) as Promise<{ ok: boolean; deleted: number }>;
    },
    onSuccess: (data) => {
      toast({
        title: 'Рассылка удалена',
        description: `Сообщений удалено у получателей: ${data?.deleted ?? 0}`,
      });
      refetch?.();
      queryClient.invalidateQueries({ queryKey: ['infinite-users', projectId] });
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
