/**
 * @fileoverview Хук загрузки деталей рассылки с результатами ошибок
 * @module client/components/editor/broadcast/hooks/use-broadcast-detail
 */

import { useQuery } from '@tanstack/react-query';
import type { Broadcast, BroadcastResult } from '../types';

/**
 * Ответ сервера на GET /api/projects/:projectId/broadcasts/:broadcastId
 */
export interface BroadcastDetailResponse {
  /** Данные рассылки */
  broadcast: Broadcast;
  /** Список результатов с ошибками */
  results: BroadcastResult[];
}

/**
 * Результат хука useBroadcastDetail
 */
export interface UseBroadcastDetailResult {
  /** Данные рассылки или undefined */
  broadcast: Broadcast | undefined;
  /** Список результатов с ошибками */
  results: BroadcastResult[];
  /** Флаг загрузки */
  isLoading: boolean;
  /** Функция принудительного обновления */
  refetch: () => void;
}

/**
 * Хук загрузки деталей рассылки.
 * Выполняет GET /api/projects/:projectId/broadcasts/:broadcastId
 *
 * @param projectId - Идентификатор проекта
 * @param broadcastId - Идентификатор рассылки (null — запрос не выполняется)
 * @returns Детали рассылки, список ошибок, флаг загрузки и функция обновления
 */
export function useBroadcastDetail(
  projectId: number,
  broadcastId: number | null | undefined,
): UseBroadcastDetailResult {
  const url = `/api/projects/${projectId}/broadcasts/${broadcastId}`;

  const { data, isLoading, refetch } = useQuery<BroadcastDetailResponse>({
    queryKey: [url],
    enabled: !!projectId && !!broadcastId,
    staleTime: 0,
    gcTime: 0,
  });

  return {
    broadcast: data?.broadcast,
    results: data?.results ?? [],
    isLoading,
    refetch,
  };
}
