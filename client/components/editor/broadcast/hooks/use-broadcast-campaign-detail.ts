/**
 * @fileoverview Хук загрузки большой рассылки вместе с рассылками по каждому боту
 * @module client/components/editor/broadcast/hooks/use-broadcast-campaign-detail
 */

import { useQuery } from '@tanstack/react-query';
import type { Broadcast, BroadcastCampaign } from '../types';

/**
 * Ответ сервера GET /api/projects/:projectId/broadcast-campaigns/:campaignId
 */
export interface BroadcastCampaignDetailResponse {
  /** Данные большой рассылки */
  campaign: BroadcastCampaign;
  /** Рассылки по каждому боту */
  broadcasts: Broadcast[];
}

/**
 * Результат хука useBroadcastCampaignDetail
 */
export interface UseBroadcastCampaignDetailResult {
  /** Данные большой рассылки или undefined */
  campaign: BroadcastCampaign | undefined;
  /** Рассылки по каждому боту */
  broadcasts: Broadcast[];
  /** Флаг загрузки */
  isLoading: boolean;
  /** Функция принудительного обновления */
  refetch: () => void;
}

/**
 * Формирует ключ запроса деталей большой рассылки
 * @param projectId - Идентификатор проекта
 * @param campaignId - Идентификатор большой рассылки
 * @returns URL для query key
 */
export function buildCampaignDetailKey(projectId: number, campaignId: number): string {
  return `/api/projects/${projectId}/broadcast-campaigns/${campaignId}`;
}

/**
 * Хук загрузки деталей большой рассылки.
 *
 * @param projectId - Идентификатор проекта
 * @param campaignId - Идентификатор большой рассылки (null — запрос не выполняется)
 * @param enabled - Разрешить выполнение запроса (по умолчанию true)
 * @returns Данные большой рассылки, её рассылки по ботам и функция обновления
 */
export function useBroadcastCampaignDetail(
  projectId: number,
  campaignId: number | null | undefined,
  enabled = true,
): UseBroadcastCampaignDetailResult {
  const { data, isLoading, refetch } = useQuery<BroadcastCampaignDetailResponse>({
    queryKey: [buildCampaignDetailKey(projectId, campaignId ?? 0)],
    enabled: enabled && !!projectId && !!campaignId,
    staleTime: 0,
    gcTime: 0,
  });

  return {
    campaign: data?.campaign,
    broadcasts: data?.broadcasts ?? [],
    isLoading,
    refetch,
  };
}
