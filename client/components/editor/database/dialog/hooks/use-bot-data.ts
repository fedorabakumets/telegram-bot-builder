/**
 * @fileoverview Хук загрузки данных бота
 * Загружает информацию о боте из bot_users
 */

import { useQuery } from '@tanstack/react-query';
import { UserBotData } from '@shared/schema';

/**
 * Хук для загрузки данных бота
 * @param projectId - Идентификатор проекта
 * @returns Данные бота и состояние загрузки
 */
export function useBotData(projectId: number) {
  const { data: bot, isLoading } = useQuery<UserBotData | null>({
    queryKey: [`/api/projects/${projectId}/bot/data`],
    enabled: !!projectId,
    staleTime: 60_000,
    select: (data) => {
      // Защита: если данные не объект или null, возвращаем null
      if (!data || typeof data !== 'object') {
        console.warn('useBotData: API returned invalid data:', data);
        return null;
      }
      return data;
    },
  });

  return { bot, isLoading };
}
