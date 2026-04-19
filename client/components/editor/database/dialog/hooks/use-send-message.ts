/**
 * @fileoverview Хук отправки сообщения пользователю
 * @description Управляет мутацией отправки и обработкой результатов
 */

import { useMutation } from '@tanstack/react-query';
import { buildUsersApiUrl } from '@/components/editor/database/utils';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/queryClient';

/**
 * Хук для отправки сообщения пользователю
 * @param projectId - Идентификатор проекта
 * @param selectedTokenId - Идентификатор выбранного токена
 * @param userId - Идентификатор пользователя
 * @param onSent - Колбэк после успешной отправки
 * @returns Мутация отправки сообщения
 */
export function useSendMessage(
  projectId: number,
  selectedTokenId?: number | null,
  userId?: number,
  onSent?: () => void
) {
  const { toast } = useToast();

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
    onSuccess: () => {
      onSent?.();
      toast({
        title: 'Сообщение отправлено',
        description: 'Сообщение успешно отправлено пользователю',
      });
    },
    onError: () => {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
        variant: 'destructive',
      });
    }
  });
}
