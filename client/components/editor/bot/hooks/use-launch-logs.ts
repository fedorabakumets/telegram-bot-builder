/**
 * @fileoverview Хук для получения логов конкретного запуска бота
 * @module bot/hooks/use-launch-logs
 */

import { useQuery } from '@tanstack/react-query';
import type { BotLog } from '@shared/schema';

/**
 * Загружает логи конкретного запуска бота по его ID
 * @param launchId - ID запуска (undefined — запрос не выполняется)
 * @returns Сохранённые строки, отдельные состояния запроса и повторная загрузка
 */
export function useLaunchLogs(launchId: number | undefined): {
  /** Строки выбранного запуска, включая ранее полученный ответ при сбое обновления. */
  logs: BotLog[];
  /** Идёт первая загрузка без сохранённого ответа. */
  isLoading: boolean;
  /** Запрос завершился ошибкой; ранее полученные строки сохраняются. */
  isError: boolean;
  /** Выполняется повторная загрузка уже открытого запуска. */
  isRefreshing: boolean;
  /** Повторно запрашивает выбранный запуск. */
  retry: () => void;
} {
  const query = useQuery<BotLog[]>({
    queryKey: ['launch-logs', launchId],
    queryFn: async ({ signal }) => {
      const res = await fetch(`/api/launch/${launchId}/logs`, { signal, credentials: 'include' });
      if (!res.ok) throw new Error('Ошибка загрузки логов');
      return res.json();
    },
    enabled: launchId !== undefined,
    staleTime: 60_000,
  });

  return {
    logs: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    isRefreshing: query.isFetching && !query.isLoading,
    retry: () => { void query.refetch(); },
  };
}
