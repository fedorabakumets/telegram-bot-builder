/**
 * @fileoverview Хук загрузки списка рассылок проекта
 * @module client/components/editor/broadcast/hooks/use-broadcasts
 */

import { useQuery } from '@tanstack/react-query';
import type { Broadcast } from '../types';

/**
 * Результат хука useBroadcasts
 */
export interface UseBroadcastsResult {
  /** Список рассылок */
  broadcasts: Broadcast[];
  /** Флаг загрузки */
  isLoading: boolean;
  /** Функция принудительного обновления */
  refetch: () => void;
}

/**
 * Хук загрузки списка рассылок для проекта.
 * Выполняет GET /api/projects/:projectId/broadcasts
 *
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор токена (опционально)
 * @returns Список рассылок, флаг загрузки и функция обновления
 */
export function useBroadcasts(
  projectId: number,
  tokenId?: number | null,
): UseBroadcastsResult {
  const params = tokenId ? `?tokenId=${tokenId}` : '';
  const queryKey = [`/api/projects/${projectId}/broadcasts${params}`];

  const { data, isLoading, refetch } = useQuery<Broadcast[]>({
    queryKey,
    enabled: !!projectId,
    staleTime: 0,
    gcTime: 0,
  });

  return {
    broadcasts: data ?? [],
    isLoading,
    refetch,
  };
}
