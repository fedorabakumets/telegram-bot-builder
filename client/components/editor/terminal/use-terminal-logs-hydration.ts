/**
 * @fileoverview Загрузка live-логов из bot_logs при открытии терминала
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
  const { hydrateLogs } = useBotLogs();
  const logKey = projectId && tokenId ? `${projectId}-${tokenId}` : null;

  const { data } = useQuery<BotLog[]>({
    queryKey: ['/api/projects', projectId, 'tokens', tokenId, 'logs'],
    queryFn: () => apiRequest('GET', `/api/projects/${projectId}/tokens/${tokenId}/logs`),
    enabled: !!projectId && !!tokenId,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!logKey || !data?.length) return;
    hydrateLogs(logKey, data.map(botLogToTerminalLine));
  }, [logKey, data, hydrateLogs]);
}
