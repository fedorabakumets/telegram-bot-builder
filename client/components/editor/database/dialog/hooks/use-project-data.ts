/**
 * @fileoverview Хук для загрузки данных проекта
 * @description Получает полные данные проекта через API
 */

import { useQuery } from '@tanstack/react-query';
import type { BotProject } from '@shared/schema';

/**
 * Результат работы хука useProjectData
 */
export interface UseProjectDataResult {
  /** Данные проекта */
  project: BotProject | null;
  /** Флаг загрузки */
  isLoading: boolean;
  /** Флаг ошибки */
  isError: boolean;
  /** Функция перезагрузки данных */
  refetch: () => void;
}

/**
 * Хук для получения данных проекта
 * @param projectId - Идентификатор проекта
 * @returns Объект с данными проекта и состоянием загрузки
 */
export function useProjectData(projectId: number): UseProjectDataResult {
  const { data, isLoading, isError, refetch } = useQuery<BotProject>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 минут
    retry: 1,
  });

  return {
    project: data || null,
    isLoading,
    isError,
    refetch,
  };
}
