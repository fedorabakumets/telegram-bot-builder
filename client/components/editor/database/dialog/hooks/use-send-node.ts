/**
 * @fileoverview Хук для отправки данных узла пользователю
 * @description Отправляет содержимое узла с поддержкой tokenId
 */

import { useMutation } from '@tanstack/react-query';
import { buildUsersApiUrl } from '@/components/editor/database/utils';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/queryClient';

/**
 * Данные для отправки узла
 */
export interface SendNodeData {
  /** ID узла для отправки */
  nodeId: string;
  /** ID пользователя */
  userId: number;
  /** Дополнительные данные пользователя */
  userData?: Record<string, unknown>;
}

/**
 * Хук для отправки содержимого узла пользователю
 * @param projectId - Идентификатор проекта
 * @param selectedTokenId - Идентификатор выбранного токена
 * @param onSent - Колбэк после успешной отправки
 * @returns Мутация отправки узла
 */
export function useSendNode(
  projectId: number,
  selectedTokenId?: number | null,
  onSent?: () => void
) {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ nodeId, userId, userData }: SendNodeData) => {
      return apiRequest(
        'POST',
        buildUsersApiUrl(`/api/projects/${projectId}/users/${userId}/send-node-message`, selectedTokenId),
        { nodeId, userData }
      );
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
