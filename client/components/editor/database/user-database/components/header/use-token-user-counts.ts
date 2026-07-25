/**
 * @fileoverview Загрузка числа пользователей bot_users по токенам проекта
 * @module client/.../header/use-token-user-counts
 */

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { buildUsersApiUrl } from '@/components/editor/database/utils';
import { apiRequest } from '@/queryClient';

/** Ответ /api/projects/:id/users/stats */
interface TokenUserStats {
  /** Число пользователей у токена */
  totalUsers?: number;
}

/**
 * Загружает totalUsers для каждого токена проекта
 * @param projectId - ID проекта
 * @param tokenIds - ID токенов ботов
 * @returns Карта tokenId → число пользователей
 */
export function useTokenUserCounts(
  projectId: number,
  tokenIds: number[],
): Map<number, number> {
  const stableIds = useMemo(() => {
    const unique = Array.from(new Set(tokenIds.filter((id) => id > 0)));
    unique.sort((a, b) => a - b);
    return unique;
  }, [tokenIds]);

  const results = useQueries({
    queries: stableIds.map((tokenId) => {
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
    const map = new Map<number, number>();
    stableIds.forEach((tokenId, index) => {
      const total = results[index]?.data?.totalUsers;
      if (typeof total === 'number') {
        map.set(tokenId, total);
      }
    });
    return map;
  }, [stableIds, results]);
}

/**
 * Сортирует токены по убыванию числа пользователей
 * @param tokens - Список токенов
 * @param counts - Карта tokenId → count (−1 если ещё нет данных)
 * @returns Новый отсортированный массив
 */
export function sortTokensByUserCountDesc<T extends { id: number }>(
  tokens: T[],
  counts: Map<number, number>,
): T[] {
  return [...tokens].sort((left, right) => {
    const rightCount = counts.get(right.id) ?? -1;
    const leftCount = counts.get(left.id) ?? -1;
    return rightCount - leftCount;
  });
}
