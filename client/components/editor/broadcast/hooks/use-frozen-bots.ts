/** @fileoverview Статусы заморозки ботов проекта для мастера рассылки. */
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import { projectBotStatusesQueryKey } from '@/components/editor/bot/project-bot-statuses-query';

/** Состояние отдельного бота, полученное от панели. */
interface BotStatus {
  /** Идентификатор токена. */
  tokenId: number;
  /** Telegram подтвердил заморозку. */
  frozen?: boolean;
}

/**
 * Получает известные статусы заморозки и периодически обновляет их.
 * @param projectId - Идентификатор проекта
 * @returns Запрос статусов и список замороженных ботов
 */
export function useFrozenBots(projectId: number) {
  return useQuery({
    queryKey: projectBotStatusesQueryKey(projectId),
    queryFn: () => apiRequest('GET', `/api/projects/${projectId}/bot/statuses`) as Promise<{ statuses: BotStatus[] }>,
    enabled: !!projectId,
    refetchInterval: 15000,
    staleTime: 0,
  });
}
