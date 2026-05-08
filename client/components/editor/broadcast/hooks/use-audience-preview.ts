/**
 * @fileoverview Хук предпросмотра аудитории рассылки
 * @module client/components/editor/broadcast/hooks/use-audience-preview
 */

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/queryClient';
import type { BroadcastFilters } from '../types';

/**
 * Результат хука useAudiencePreview
 */
export interface UseAudiencePreviewResult {
  /** Количество пользователей в аудитории */
  count: number;
  /** Флаг загрузки */
  isLoading: boolean;
}

/**
 * Хук предпросмотра аудитории рассылки с debounce 300ms.
 * Выполняет POST /api/projects/:projectId/broadcasts/preview-audience.
 *
 * @param projectId - Идентификатор проекта
 * @param filters - Фильтры аудитории
 * @param tokenId - Идентификатор токена (опционально)
 * @returns Количество пользователей и флаг загрузки
 */
export function useAudiencePreview(
  projectId: number,
  filters: BroadcastFilters,
  tokenId?: number | null,
): UseAudiencePreviewResult {
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  // Debounce 300ms для фильтров
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilters(filters), 300);
    return () => clearTimeout(timer);
  }, [JSON.stringify(filters)]);

  const { data, isLoading } = useQuery<{ count: number }>({
    queryKey: [
      `/api/projects/${projectId}/broadcasts/preview-audience`,
      debouncedFilters,
      tokenId,
    ],
    queryFn: async () => {
      const url = tokenId
        ? `/api/projects/${projectId}/broadcasts/preview-audience?tokenId=${tokenId}`
        : `/api/projects/${projectId}/broadcasts/preview-audience`;
      return apiRequest(
        'POST',
        url,
        { filters: debouncedFilters },
      );
    },
    enabled: !!projectId,
    staleTime: 30_000,
  });

  return {
    count: data?.count ?? 0,
    isLoading,
  };
}
