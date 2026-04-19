/**
 * @fileoverview Мутация отправки сообщения пользователю
 * @description Хук для отправки сообщения конкретному пользователю бота
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { buildUsersApiUrl } from '@/components/editor/database/utils';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/queryClient';

/**
 * Параметры хука useSendMessage
 */
interface UseSendMessageParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
}

/**
 * Хук для отправки сообщения пользователю
 * @param params - Параметры хука
 * @returns Мутация отправки сообщения
 */
export function useSendMessage(params: UseSendMessageParams) {
  const { projectId, selectedTokenId } = params;
  const { toast } = useToast();
  const qClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageText, userId }: { messageText: string; userId: string }) => {
      if (!userId) {
        throw new Error('User ID is required');
      }

      return apiRequest(
        'POST',
        buildUsersApiUrl(`/api/projects/${projectId}/users/${userId}/send-message`, selectedTokenId),
        { messageText }
      );
    },
    onSuccess: () => {
      qClient.invalidateQueries({
        queryKey: [buildUsersApiUrl(`/api/projects/${projectId}/users/messages`, selectedTokenId), selectedTokenId],
      });
      toast({
        title: 'Сообщение отправлено',
        description: 'Сообщение успешно отправлено пользователю',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Ошибка отправки',
        description: error?.message || 'Не удалось отправить сообщение',
        variant: 'destructive',
      });
    },
  });
}
