/**
 * @fileoverview Хук для загрузки списка проектов
 * Предоставляет данные о проектах и состояние загрузки
 * @module components/editor/sidebar/hooks/use-projects-query
 */

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import type { BotProject } from '@shared/schema';

/**
 * Результат работы хука загрузки проектов
 */
export interface UseProjectsQueryResult {
  /** Список проектов */
  projects: BotProject[];
  /** Индикатор загрузки */
  isLoading: boolean;
  /** Функция для принудительного обновления данных */
  refetch: () => void;
}

/**
 * Хук для получения списка проектов с сервера
 * Данные всегда считаются устаревшими для немедленного обновления
 * @returns Объект с данными о проектах и состоянием
 */
export function useProjectsQuery(): UseProjectsQueryResult {
  const { data, isLoading, refetch } = useQuery<BotProject[]>({
    queryKey: ['/api/projects'],
    queryFn: () => apiRequest('GET', '/api/projects'),
    staleTime: 0, // Данные всегда считаются устаревшими
  });

  return {
    projects: data || [],
    isLoading,
    refetch,
  };
}
