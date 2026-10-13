/**
 * @fileoverview Загрузка live-логов из bot_logs при открытии терминала
 * @description Периодический refetch подстраховывает пропуски WebSocket без F5
 * @module terminal/use-terminal-logs-hydration
 */

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import type { BotLog } from '@shared/schema';
import { useBotLogs } from '@/components/editor/bot/contexts/bot-logs-context';
import { botLogToTerminalLine } from './bot-log-utils';

/** Параметры хука */
interface UseTerminalLogsHydrationParams {
  /** ID проекта */
  projectId?: number;
  /** ID токена бота */
  tokenId?: number;
}

/**
 * Подгружает live-логи из таблицы bot_logs в BotLogsContext
 * @param params - projectId и tokenId
 */
export function useTerminalLogsHydration({ projectId, tokenId }: UseTerminalLogsHydrationParams): void {
  const { replaceLaunchLogs } = useBotLogs();
  const logKey = projectId && tokenId ? `${projectId}-${tokenId}` : null;

  const { data } = useQuery({
    queryKey: ['/api/projects', projectId, 'tokens', tokenId, 'logs', 'current-launch'],
    queryFn: async () => {
      const requestedAt = Date.now();
      const entries: BotLog[] = await apiRequest('GET', `/api/projects/${projectId}/tokens/${tokenId}/logs`);
      return { entries, requestedAt };
    },
    enabled: !!projectId && !!tokenId,
    staleTime: 3_000,
    refetchInterval: 8_000,
  });

  useEffect(() => {
    if (!logKey || !data) return;
    replaceLaunchLogs(logKey, data.entries.map(botLogToTerminalLine), data.requestedAt);
  }, [logKey, data, replaceLaunchLogs]);
}
