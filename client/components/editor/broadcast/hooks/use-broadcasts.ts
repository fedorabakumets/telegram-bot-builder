/**
 * @fileoverview Хук загрузки списка рассылок проекта с пагинацией
 * @module client/components/editor/broadcast/hooks/use-broadcasts
 */

import { useQuery } from '@tanstack/react-query';
import type { Broadcast } from '../types';

/**
 * Ответ сервера на GET /api/projects/:projectId/broadcasts
 */
interface BroadcastsResponse {
  /** Список рассылок на текущей странице */
  broadcasts: Broadcast[];
  /** Общее количество рассылок */
  total: number;
  /** Текущая страница */
  page: number;
  /** Размер страницы */
  limit: number;
}

/**
 * Результат хука useBroadcasts
 */
export interface UseBroadcastsResult {
  /** Список рассылок */
  broadcasts: Broadcast[];
  /** Флаг загрузки */
  isLoading: boolean;
  /** Общее количество рассылок */
  total: number;
  /** Функция принудительного обновления */
  refetch: () => void;
}

/**
 * Хук загрузки списка рассылок для проекта с поддержкой пагинации.
 * Выполняет GET /api/projects/:projectId/broadcasts?page=X&tokenId=Y
 *
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор токена (опционально)
 * @param page - Номер страницы (по умолчанию 1)
 * @returns Список рассылок, общее количество, флаг загрузки и функция обновления
 */
export function useBroadcasts(
  projectId: number,
  tokenId?: number | null,
  page = 1,
): UseBroadcastsResult {
  const params = new URLSearchParams({ page: String(page) });
  if (tokenId) params.set('tokenId', String(tokenId));
  const queryKey = [`/api/projects/${projectId}/broadcasts?${params.toString()}`];

  const { data, isLoading, refetch } = useQuery<BroadcastsResponse>({
    queryKey,
    enabled: !!projectId,
    staleTime: 30_000,
    gcTime: 60_000,
  });

  return {
    broadcasts: data?.broadcasts ?? [],
    total: data?.total ?? 0,
    isLoading,
    refetch,
  };
}
