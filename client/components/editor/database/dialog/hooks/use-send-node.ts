/**
 * @fileoverview Хук для отправки данных узла пользователю
 * @description Извлекает контент из узла и отправляет через Telegram API
 */

import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Node } from '@shared/schema';

/**
 * Данные для отправки узла
 */
export interface SendNodeData {
  /** ID узла для отправки */
  nodeId: string;
  /** ID пользователя */
  userId: number;
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
    mutationFn: async ({ nodeId, userId }: SendNodeData) => {
      // Получаем данные узла
      const nodeResponse = await fetch(`/api/projects/${projectId}/nodes/${nodeId}`);
      if (!nodeResponse.ok) {
        throw new Error('Не удалось получить данные узла');
      }
      const node: Node = await nodeResponse.json();

      // Извлекаем текст сообщения из данных узла
      const messageText = node.data.messageText || node.data.command || '';
      if (!messageText) {
        throw new Error('Узел не содержит текста для отправки');
      }

      // Отправляем сообщение пользователю
      return apiRequest('POST', `/api/projects/${projectId}/users/${userId}/send-message`, {
        messageText,
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
