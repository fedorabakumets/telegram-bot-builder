/**
 * @fileoverview Хук отправки сообщения пользователю
 * Управляет мутацией отправки и обработкой результатов
 */

import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

/**
 * Хук для отправки сообщения пользователю
 * @param projectId - Идентификатор проекта
 * @param userId - Идентификатор пользователя
 * @param onSent - Колбэк после успешной отправки
 * @returns Мутация отправки сообщения
 */
export function useSendMessage(
  projectId: number,
  userId?: number,
  onSent?: () => void
) {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ messageText }: { messageText: string }) => {
      if (!userId) throw new Error('No user selected');
      return apiRequest('POST', `/api/projects/${projectId}/users/${userId}/send-message`, {
        messageText
      });
    },
    onSuccess: () => {
      onSent?.();
      toast({
        title: "Сообщение отправлено",
        description: "Сообщение успешно отправлено пользователю",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение",
        variant: "destructive",
      });
    }
  });
}
