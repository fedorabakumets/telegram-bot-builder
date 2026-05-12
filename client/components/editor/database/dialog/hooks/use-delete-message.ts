/**
 * @fileoverview Хук удаления сообщения с оптимистичным обновлением UI
 * @description Выполняет DELETE-запрос, мгновенно скрывает сообщение из списка,
 * откатывает изменение при ошибке и запускает refetch после успеха.
 */

import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

/**
 * Параметры хука useDeleteMessage
 */
interface UseDeleteMessageParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
  /** Колбэк оптимистичного скрытия сообщения по id */
  onOptimisticRemove: (messageId: number) => void;
  /** Колбэк восстановления сообщения при ошибке */
  onRollback: (messageId: number) => void;
  /** Колбэк после успешного удаления (refetch) */
  onDeleted?: () => void;
}

/**
 * Ответ сервера на удаление сообщения
 */
interface DeleteMessageResponse {
  /** Признак успешного удаления */
  success: boolean;
  /** Было ли удалено сообщение из Telegram */
  deletedFromTelegram: boolean;
}

/**
 * Хук для удаления сообщения с оптимистичным обновлением UI.
 * При вызове mutate(messageId) — мгновенно скрывает сообщение из списка.
 * При ошибке — восстанавливает сообщение обратно.
 * При успехе — показывает toast и запускает refetch.
 *
 * @param params - Параметры хука
 * @returns Мутация удаления сообщения
 */
export function useDeleteMessage({
  projectId,
  selectedTokenId,
  onOptimisticRemove,
  onRollback,
  onDeleted,
}: UseDeleteMessageParams) {
  const { toast } = useToast();

  return useMutation<DeleteMessageResponse, Error, number>({
    /**
     * Выполняет DELETE-запрос к серверу
     * @param messageId - Идентификатор удаляемого сообщения
     * @returns Ответ сервера
     */
    mutationFn: async (messageId: number) => {
      const tokenParam = selectedTokenId != null ? `?tokenId=${selectedTokenId}` : '';
      const url = `/api/projects/${projectId}/messages/${messageId}${tokenParam}`;

      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error((errorData as { message?: string }).message ?? 'Ошибка удаления');
      }

      return response.json() as Promise<DeleteMessageResponse>;
    },

    onMutate: (messageId: number) => {
      // Оптимистично скрываем сообщение до ответа сервера
      onOptimisticRemove(messageId);
    },

    onSuccess: () => {
      toast({
        title: 'Сообщение удалено',
        description: 'Сообщение успешно удалено',
      });
      onDeleted?.();
    },

    onError: (_error: Error, messageId: number) => {
      // Восстанавливаем сообщение при ошибке
      onRollback(messageId);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить сообщение',
        variant: 'destructive',
      });
    },
  });
}
