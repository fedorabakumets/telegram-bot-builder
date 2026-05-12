/**
 * @fileoverview Хук редактирования сообщения бота с оптимистичным обновлением UI
 * @description Выполняет PATCH-запрос, мгновенно обновляет текст в UI,
 * откатывает изменение при ошибке.
 */

import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

/**
 * Параметры хука useEditMessage
 */
interface UseEditMessageParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
  /** Колбэк оптимистичного обновления текста сообщения */
  onOptimisticEdit: (messageId: number, newText: string) => void;
  /** Колбэк восстановления оригинального текста при ошибке */
  onRollback: (messageId: number, originalText: string) => void;
  /** Колбэк после успешного редактирования */
  onEdited?: () => void;
}

/**
 * Переменные мутации редактирования
 */
interface EditMessageVariables {
  /** Идентификатор редактируемого сообщения */
  messageId: number;
  /** Новый текст сообщения */
  messageText: string;
  /** Оригинальный текст для отката при ошибке */
  originalText: string;
}

/**
 * Ответ сервера на редактирование сообщения
 */
interface EditMessageResponse {
  /** Признак успешного редактирования */
  success: boolean;
  /** Было ли отредактировано сообщение в Telegram */
  editedInTelegram: boolean;
}

/**
 * Хук для редактирования сообщения бота с оптимистичным обновлением UI.
 * При вызове mutate — мгновенно обновляет текст в списке.
 * При ошибке — восстанавливает оригинальный текст.
 * При успехе — показывает toast.
 *
 * @param params - Параметры хука
 * @returns Мутация редактирования сообщения
 */
export function useEditMessage({
  projectId,
  selectedTokenId,
  onOptimisticEdit,
  onRollback,
  onEdited,
}: UseEditMessageParams) {
  const { toast } = useToast();

  return useMutation<EditMessageResponse, Error, EditMessageVariables>({
    /**
     * Выполняет PATCH-запрос к серверу
     * @param variables - Параметры редактирования
     * @returns Ответ сервера
     */
    mutationFn: async ({ messageId, messageText }: EditMessageVariables) => {
      const tokenParam = selectedTokenId != null ? `?tokenId=${selectedTokenId}` : '';
      const url = `/api/projects/${projectId}/messages/${messageId}${tokenParam}`;

      const response = await fetch(url, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageText }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error((errorData as { message?: string }).message ?? 'Ошибка редактирования');
      }

      return response.json() as Promise<EditMessageResponse>;
    },

    onMutate: ({ messageId, messageText }: EditMessageVariables) => {
      // Оптимистично обновляем текст до ответа сервера
      onOptimisticEdit(messageId, messageText);
    },

    onSuccess: () => {
      toast({ title: 'Сообщение изменено', description: 'Текст сообщения успешно обновлён' });
      onEdited?.();
    },

    onError: (_error: Error, { messageId, originalText }: EditMessageVariables) => {
      // Восстанавливаем оригинальный текст при ошибке
      onRollback(messageId, originalText);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отредактировать сообщение',
        variant: 'destructive',
      });
    },
  });
}
