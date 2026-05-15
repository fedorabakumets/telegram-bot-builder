/**
 * @fileoverview Хук для получения env-переменных бота в панели свойств
 * Используется для селектора подключения к БД в psql_query ноде
 * @module components/editor/properties/hooks/use-env-variables-for-node
 */

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';

/** Элемент env-переменной для селектора */
export interface EnvVarItem {
  /** Имя переменной (KEY) */
  key: string;
  /** Значение (замаскировано для секретных) */
  value: string;
}

/**
 * Хук получения env-переменных бота для использования в нодах
 * @param projectId - ID проекта
 * @returns Массив env-переменных бота
 */
export function useEnvVariablesForNode(projectId: number): EnvVarItem[] {
  const { data } = useQuery({
    queryKey: [`/api/projects/${projectId}/tokens/first/env-variables`],
    queryFn: async () => {
      if (!projectId) return { items: [] };
      const tokenData = await apiRequest('GET', `/api/projects/${projectId}/tokens/first`);
      if (!tokenData?.id) return { items: [] };
      return apiRequest('GET', `/api/projects/${projectId}/tokens/${tokenData.id}/env-variables`);
    },
    enabled: !!projectId,
    staleTime: 60000,
  });

  const items: EnvVarItem[] = (data?.items || []).map((item: any) => ({
    key: item.key,
    value: item.value || '••••••',
  }));

  return items;
}
