/**
 * @fileoverview Хук для отправки данных узла пользователю
 * @description Отправляет сообщение от узла с поддержкой медиа, кнопок, замены переменных и форматирования
 */

import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

/**
 * Данные для отправки узла
 */
export interface SendNodeData {
  /** ID узла для отправки */
  nodeId: string;
  /** ID пользователя */
  userId: number;
  /** Дополнительные данные пользователя для замены переменных */
  userData?: Record<string, unknown>;
}

/**
 * Хук для отправки содержимого узла пользователю
 * @param projectId - Идентификатор проекта
 * @param onSent - Колбэк после успешной отправки
 * @returns Мутация отправки узла
 */
export function useSendNode(
  projectId: number,
  onSent?: () => void
) {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ nodeId, userId, userData }: SendNodeData) => {
      // Отправляем запрос на отправку узла с поддержкой медиа и кнопок
      return apiRequest('POST', `/api/projects/${projectId}/users/${userId}/send-node-message`, {
        nodeId,
        userData,
      });
    },
    onSuccess: () => {
      onSent?.();
      toast({
        title: 'Узел отправлен',
        description: 'Содержимое узла отправлено пользователю',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось отправить узел',
        variant: 'destructive',
      });
    },
  });
}
