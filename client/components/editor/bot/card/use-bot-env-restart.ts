/**
 * @fileoverview Отслеживаемый перезапуск бота после сохранения переменных.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import { invalidateBotStatusQueries } from '../invalidate-bot-status-queries';

/**
 * Перезапускает процесс и сообщает карточке о выполняемой операции.
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор токена
 * @returns Мутация перезапуска
 */
export function useBotEnvRestart(projectId: number, tokenId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationKey: ['bot-env-restart', projectId, tokenId],
    /** Останавливает старый процесс и запускает новый с сохранёнными настройками. */
    mutationFn: async () => {
      try {
        await apiRequest('POST', `/api/projects/${projectId}/bot/stop`, { tokenId });
      } catch { /* Уже остановленный процесс также допускает повторный запуск. */ }
      await apiRequest('POST', `/api/projects/${projectId}/bot/start`, { tokenId });
    },
    /** Обновляет подтверждённые статусы и историю после завершения операции. */
    onSettled: () => {
      invalidateBotStatusQueries(client, projectId, tokenId);
      client.invalidateQueries({ queryKey: ['launch-history', tokenId] });
    },
  });
}
