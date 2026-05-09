/**
 * @fileoverview Хук для загрузки данных трафика пользователей
 * @description Получает источники трафика и языки через GET /api/projects/:id/users/traffic
 */

import { useQuery } from '@tanstack/react-query';
import { buildUsersApiUrl } from '@/components/editor/database/utils';

/**
 * Источник трафика (utm-метка или direct)
 */
export interface TrafficSource {
  /** Параметр источника, например "instagram", "direct", "ref_123" */
  param: string;
  /** Количество пользователей из этого источника */
  count: number;
  /** Процент от общего числа пользователей */
  percentage: number;
}

/**
 * Язык пользователей
 */
export interface TrafficLanguage {
  /** Код языка, например "ru", "en", "uk" */
  code: string;
  /** Количество пользователей с этим языком */
  count: number;
  /** Процент от общего числа пользователей */
  percentage: number;
}

/**
 * Данные трафика: источники и языки
 */
export interface TrafficData {
  /** Список источников трафика */
  sources: TrafficSource[];
  /** Список языков пользователей */
  languages: TrafficLanguage[];
}

/**
 * Параметры хука useTraffic
 */
interface UseTrafficParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
}

/**
 * Хук для загрузки данных трафика (источники и языки)
 * @param params - Параметры хука
 * @returns Данные трафика и состояние загрузки
 */
export function useTraffic(params: UseTrafficParams) {
  const { projectId, selectedTokenId } = params;
  const requestUrl = buildUsersApiUrl(
    `/api/projects/${projectId}/users/traffic`,
    selectedTokenId
  );

  const { data, isLoading } = useQuery<TrafficData>({
    queryKey: [requestUrl, selectedTokenId],
    queryFn: async () => {
      const response = await fetch(requestUrl, {
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    },
    enabled: !!projectId,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });

  return {
    sources: data?.sources ?? [],
    languages: data?.languages ?? [],
    isLoading,
  };
}
