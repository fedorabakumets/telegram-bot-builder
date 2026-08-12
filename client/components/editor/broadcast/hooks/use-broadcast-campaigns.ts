/**
 * @fileoverview Хук загрузки списка больших рассылок проекта (по нескольким ботам)
 * @module client/components/editor/broadcast/hooks/use-broadcast-campaigns
 */

import { useQuery } from '@tanstack/react-query';
import type { BroadcastCampaign } from '../types';

/**
 * Ответ сервера GET /api/projects/:projectId/broadcast-campaigns
 */
interface BroadcastCampaignsResponse {
  /** Список больших рассылок, новые первыми */
  campaigns: BroadcastCampaign[];
}

/**
 * Результат хука useBroadcastCampaigns
 */
export interface UseBroadcastCampaignsResult {
  /** Список больших рассылок */
  campaigns: BroadcastCampaign[];
  /** Флаг загрузки */
  isLoading: boolean;
  /** Функция принудительного обновления */
  refetch: () => void;
}

/**
 * Формирует ключ запроса списка больших рассылок проекта
 * @param projectId - Идентификатор проекта
 * @returns URL для query key
 */
export function buildCampaignsKey(projectId: number): string {
  return `/api/projects/${projectId}/broadcast-campaigns`;
}

/**
 * Хук загрузки списка больших рассылок проекта.
 * Выполняет GET /api/projects/:projectId/broadcast-campaigns
 *
 * @param projectId - Идентификатор проекта
 * @returns Список больших рассылок, флаг загрузки и функция обновления
 */
export function useBroadcastCampaigns(projectId: number): UseBroadcastCampaignsResult {
  const { data, isLoading, refetch } = useQuery<BroadcastCampaignsResponse>({
    queryKey: [buildCampaignsKey(projectId)],
    enabled: !!projectId,
    staleTime: 30_000,
    gcTime: 60_000,
  });

  return {
    campaigns: data?.campaigns ?? [],
    isLoading,
    refetch,
  };
}
