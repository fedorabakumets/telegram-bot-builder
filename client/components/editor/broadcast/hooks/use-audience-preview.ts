/**
 * @fileoverview Хук предпросмотра аудитории рассылки (один или несколько ботов)
 * @module client/components/editor/broadcast/hooks/use-audience-preview
 */

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/queryClient';
import type { BroadcastFilters } from '../types';

/**
 * Количество получателей у одного бота
 */
export interface AudiencePerBot {
  /** Идентификатор бота */
  tokenId: number;
  /** Количество получателей у этого бота */
  count: number;
}

/**
 * Ответ сервера POST …/broadcasts/preview-audience
 */
interface PreviewAudienceResponse {
  /** Количество получателей (для совместимости с одиночной рассылкой) */
  count: number;
  /** Суммарное количество отправок по всем ботам */
  total?: number;
  /** Количество уникальных людей среди всех ботов */
  uniqueCount?: number;
  /** Разбивка получателей по ботам */
  perBot?: AudiencePerBot[];
  /** Сколько людей получат сообщение более одного раза */
  overlapEstimate?: number;
}

/**
 * Результат хука useAudiencePreview
 */
export interface UseAudiencePreviewResult {
  /** Количество получателей (сумма по всем выбранным ботам) */
  count: number;
  /** Суммарное количество отправок по всем ботам */
  total: number;
  /** Количество уникальных людей среди всех ботов */
  uniqueCount: number;
  /** Разбивка получателей по ботам */
  perBot: AudiencePerBot[];
  /** Сколько людей получат сообщение от нескольких ботов */
  overlapEstimate: number;
  /** Флаг загрузки */
  isLoading: boolean;
}

/**
 * Хук предпросмотра аудитории рассылки с debounce 300ms.
 * Выполняет POST /api/projects/:projectId/broadcasts/preview-audience.
 * Если переданы tokenIds — считает суммарную аудиторию выбранных ботов,
 * иначе работает в режиме одного бота (tokenId).
 *
 * @param projectId - Идентификатор проекта
 * @param filters - Фильтры аудитории
 * @param tokenId - Идентификатор бота для режима одного бота (опционально)
 * @param tokenIds - Идентификаторы выбранных ботов (опционально)
 * @returns Счётчики получателей, разбивка по ботам и флаг загрузки
 */
export function useAudiencePreview(
  projectId: number,
  filters: BroadcastFilters,
  tokenId?: number | null,
  tokenIds?: number[] | null,
): UseAudiencePreviewResult {
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  // Debounce 300ms для фильтров
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilters(filters), 300);
    return () => clearTimeout(timer);
  }, [JSON.stringify(filters)]);

  /** Нормализованный список ботов: пустой массив → режим одного бота */
  const selectedTokenIds = tokenIds && tokenIds.length > 0 ? [...tokenIds].sort((a, b) => a - b) : null;

  const { data, isLoading } = useQuery<PreviewAudienceResponse>({
    queryKey: [
      `/api/projects/${projectId}/broadcasts/preview-audience`,
      debouncedFilters,
      selectedTokenIds ?? tokenId,
    ],
    queryFn: async () => {
      if (selectedTokenIds) {
        return apiRequest(
          'POST',
          `/api/projects/${projectId}/broadcasts/preview-audience`,
          { filters: debouncedFilters, tokenIds: selectedTokenIds },
        );
      }
      const url = tokenId
        ? `/api/projects/${projectId}/broadcasts/preview-audience?tokenId=${tokenId}`
        : `/api/projects/${projectId}/broadcasts/preview-audience`;
      return apiRequest('POST', url, { filters: debouncedFilters });
    },
    enabled: !!projectId,
    staleTime: 30_000,
  });

  const total = data?.total ?? data?.count ?? 0;

  return {
    count: total,
    total,
    uniqueCount: data?.uniqueCount ?? total,
    perBot: data?.perBot ?? [],
    overlapEstimate: data?.overlapEstimate ?? 0,
    isLoading,
  };
}
