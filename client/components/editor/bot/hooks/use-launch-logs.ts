/**
 * @fileoverview Хук для получения логов конкретного запуска бота
 * @module bot/hooks/use-launch-logs
 */

import { useQuery } from '@tanstack/react-query';
import type { BotLog } from '@shared/schema';

/**
 * Загружает логи конкретного запуска бота по его ID
 * @param launchId - ID запуска (undefined — запрос не выполняется)
 * @returns Объект с массивом логов и флагом загрузки
 */
export function useLaunchLogs(launchId: number | undefined): {
  logs: BotLog[];
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery<BotLog[]>({
    queryKey: ['launch-logs', launchId],
    queryFn: async () => {
      const res = await fetch(`/api/launch/${launchId}/logs`);
      if (!res.ok) throw new Error('Ошибка загрузки логов');
      return res.json();
    },
    enabled: launchId !== undefined,
    staleTime: 60_000,
  });

  return { logs: data ?? [], isLoading };
}
