/**
 * @fileoverview Загрузка количества пользователей для терминалов ботов.
 * @module terminal/use-terminal-user-counts
 */

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { buildUsersApiUrl } from '@/components/editor/database/utils';
import { apiRequest } from '@/queryClient';
import type { TerminalInfo } from '../bot/contexts/ActiveTerminalsContext';

/** Ответ API /api/projects/:id/users/stats */
interface TokenUserStats {
  /** Общее число пользователей бота */
  totalUsers?: number;
}

/** Ключ пары projectId + tokenId */
interface TerminalStatsKey {
  /** ID проекта */
  projectId: number;
  /** ID токена бота */
  tokenId: number;
  /** Строковый ключ `${projectId}_${tokenId}` */
  key: string;
}

/**
 * Собирает уникальные пары project/token из списка терминалов.
 * @param terminals - Активные вкладки терминала
 * @returns Уникальные ключи для запроса статистики
 */
function collectTerminalStatsKeys(terminals: TerminalInfo[]): TerminalStatsKey[] {
  const seen = new Set<string>();

  return terminals.reduce<TerminalStatsKey[]>((acc, terminal) => {
    const key = `${terminal.projectId}_${terminal.tokenId}`;
    if (seen.has(key)) return acc;
    seen.add(key);
    acc.push({
      projectId: terminal.projectId,
      tokenId: terminal.tokenId,
      key,
    });
    return acc;
  }, []);
}

/**
 * Загружает totalUsers для каждого бота в списке терминалов.
 * @param terminals - Активные вкладки терминала
 * @returns Карта `${projectId}_${tokenId}` → число пользователей
 */
export function useTerminalUserCounts(terminals: TerminalInfo[]): Map<string, number> {
  const statsKeys = useMemo(() => collectTerminalStatsKeys(terminals), [terminals]);

  const results = useQueries({
    queries: statsKeys.map(({ projectId, tokenId }) => {
      const url = buildUsersApiUrl(`/api/projects/${projectId}/users/stats`, tokenId);
      return {
        queryKey: [url, tokenId],
        queryFn: () => apiRequest<TokenUserStats>('GET', url),
        staleTime: 30_000,
        enabled: projectId > 0 && tokenId > 0,
      };
    }),
  });

  return useMemo(() => {
    const map = new Map<string, number>();
    statsKeys.forEach(({ key }, index) => {
      const totalUsers = results[index]?.data?.totalUsers;
      if (typeof totalUsers === 'number') {
        map.set(key, totalUsers);
      }
    });
    return map;
  }, [statsKeys, results]);
}
