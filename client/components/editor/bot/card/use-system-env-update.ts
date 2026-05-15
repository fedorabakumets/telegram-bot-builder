/**
 * @fileoverview Хук для обновления системных переменных окружения бота
 * Маппит ключ переменной на соответствующий API эндпоинт
 * @module components/editor/bot/card/use-system-env-update
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';

/** Переменные, которые хранятся как кастомные env-variables в bot_env_variables */
const ENV_VAR_KEYS = new Set([
  'API_BASE_URL', 'API_PORT', 'API_USE_SSL',
  'API_TIMEOUT', 'DISABLE_ASYNC_LOG', 'REDIS_URL',
]);

/**
 * Хук для обновления системных переменных через API
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @returns Функция handleSystemUpdate для передачи в BotEnvRow
 */
export function useSystemEnvUpdate(projectId: number, tokenId: number) {
  const queryClient = useQueryClient();
  const envBaseUrl = `/api/projects/${projectId}/tokens/${tokenId}/env-variables`;

  /** Мутация обновления системной переменной */
  const mutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      if (ENV_VAR_KEYS.has(key)) {
        /** Получаем список кастомных переменных для поиска существующей */
        const res = await apiRequest('GET', envBaseUrl);
        const existing = res.items?.find((v: any) => v.key === key);
        if (existing) {
          return apiRequest('PUT', `${envBaseUrl}/${existing.id}`, { value });
        }
        return apiRequest('POST', envBaseUrl, {
          key, value, isSecret: key === 'REDIS_URL' ? 1 : 0,
        });
      }

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
      /** Инвалидируем кастомные переменные чтобы обновить значения в панели */
      queryClient.invalidateQueries({ queryKey: [envBaseUrl] });
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
