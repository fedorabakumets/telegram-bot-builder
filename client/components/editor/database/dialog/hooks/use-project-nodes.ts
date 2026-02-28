/**
 * @fileoverview Хук для загрузки узлов проекта
 * @description Получает список всех узлов проекта через API
 */

import { useQuery } from '@tanstack/react-query';
import type { Node } from '@shared/schema';

/**
 * Результат работы хука useProjectNodes
 */
export interface UseProjectNodesResult {
  /** Массив узлов проекта */
  nodes: Node[];
  /** Флаг загрузки */
  isLoading: boolean;
  /** Флаг ошибки */
  isError: boolean;
  /** Функция перезагрузки данных */
  refetch: () => void;
}

/**
 * Хук для получения списка узлов проекта
 * @param projectId - Идентификатор проекта
 * @returns Объект с узлами и состоянием загрузки
 */
export function useProjectNodes(projectId: number): UseProjectNodesResult {
  const { data, isLoading, isError, refetch } = useQuery<Node[]>({
    queryKey: [`/api/projects/${projectId}/nodes`],
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 минут
  });

  return {
    nodes: data || [],
    isLoading,
    isError,
    refetch,
  };
}
