/**
 * @fileoverview Хук для обновления системных переменных окружения бота
 * Маппит ключ переменной на соответствующий API эндпоинт
 * @module components/editor/bot/card/use-system-env-update
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';

/**
 * Хук для обновления системных переменных через API
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @returns Функция handleSystemUpdate для передачи в BotEnvRow
 */
export function useSystemEnvUpdate(projectId: number, tokenId: number) {
  const queryClient = useQueryClient();

  /** Мутация обновления системной переменной */
  const mutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      switch (key) {
        case 'BOT_TOKEN':
          return apiRequest('PUT', `/api/projects/${projectId}/tokens/${tokenId}`, { token: value });
        case 'ADMIN_IDS':
          return apiRequest('PUT', `/api/projects/${projectId}/admin-ids`, { adminIds: value });
        case 'LOG_LEVEL':
          return apiRequest('PUT', `/api/projects/${projectId}/tokens/${tokenId}/log-level`, { logLevel: value });
        case 'PROTECT_CONTENT':
          return apiRequest('PUT', `/api/projects/${projectId}/tokens/${tokenId}/protect-content`, { protectContent: value === 'true' ? 1 : 0 });
        case 'SAVE_INCOMING_MEDIA':
          return apiRequest('PUT', `/api/projects/${projectId}/tokens/${tokenId}/save-incoming-media`, { saveIncomingMedia: value === 'true' ? 1 : 0 });
        default:
          throw new Error(`Неизвестная системная переменная: ${key}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] });
    },
  });

  /**
   * Обработчик обновления системной переменной
   * @param key - Имя переменной
   * @param value - Новое значение
   */
  function handleSystemUpdate(key: string, value: string) {
    if (key === 'PROJECT_ID' || key === 'TOKEN_ID') return;
    mutation.mutate({ key, value });
  }

  return { handleSystemUpdate, isPending: mutation.isPending };
}
