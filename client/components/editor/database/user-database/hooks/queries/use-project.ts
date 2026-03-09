/**
 * @fileoverview Хук для загрузки данных проекта
 * @description Получает данные проекта по ID
 */

import { useQuery } from '@tanstack/react-query';
import { BotProject } from '@shared/schema';

/**
 * Параметры хука useProject
 */
interface UseProjectParams {
  /** Идентификатор проекта */
  projectId: number;
}

/**
 * Хук для загрузки данных проекта
 * @param params - Параметры хука
 * @returns Данные проекта
 */
export function useProject(params: UseProjectParams) {
  const { projectId } = params;

  const { data: project } = useQuery<BotProject>({
    queryKey: [`/api/projects/${projectId}`],
  });

  return { project };
}
