/** @fileoverview Загрузка сохраняемой истории проверок и деталей с отдельной пагинацией. */
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import type { CheckHistoryKind, CheckHistoryPage, CheckHistoryDetail } from '@shared/check-history';
/** Загружает историю только при открытии окна. @param projectId - Проект. @param tokenId - Фильтр участника. @param kind - Вид проверки. @param enabled - Открыто ли окно. @returns Страницы и состояние запроса. */
export function useCheckHistory(projectId: number, tokenId: number | null, kind: CheckHistoryKind, enabled: boolean) {
  return useInfiniteQuery<CheckHistoryPage>({
    queryKey: ['check-history', projectId, tokenId, kind], enabled,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ kind, limit: '20' });
      if (tokenId) params.set('tokenId', String(tokenId));
      if (pageParam) params.set('cursor', String(pageParam));
      return apiRequest('GET', `/api/projects/${projectId}/check-history?${params}`);
    },
    getNextPageParam: page => page.nextCursor ?? undefined,
    staleTime: 0, refetchOnMount: 'always',
  });
}
/** Загружает выбранный сохранённый запуск. @param projectId - Проект. @param runId - ID либо отсутствие выбора. @returns Подробности и состояние запроса. */
export function useCheckHistoryDetail(projectId: number, runId: string | null) {
  return useQuery<CheckHistoryDetail>({
    queryKey: ['check-history-detail', projectId, runId], enabled: !!runId,
    queryFn: () => apiRequest('GET', `/api/projects/${projectId}/check-history/${encodeURIComponent(runId!)}`),
    staleTime: 0,
  });
}
