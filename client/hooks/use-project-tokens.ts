/**
 * @fileoverview Хук для получения токенов для всех проектов
 * Используется для получения информации о токенах, связанных с проектами
 */

import { useQueries } from '@tanstack/react-query';
import { BotToken } from '@shared/schema';

/**
 * Тип для информации о токенах проекта
 */
export type ProjectTokensInfo = {
  projectId: number;
  tokens: BotToken[];
};

/**
 * Хук для получения токенов для всех проектов
 * 
 * @param {number[]} projectIds - Массив ID проектов
 * @returns {ProjectTokensInfo[]} Массив информации о токенах для проектов
 */
export function useProjectTokens(projectIds: number[]): ProjectTokensInfo[] {
  const results = useQueries({
    queries: projectIds.map((projectId) => ({
      queryKey: [`/api/projects/${projectId}/tokens`],
      queryFn: async () => {
        const response = await fetch(`/api/projects/${projectId}/tokens`);
        if (!response.ok) {
          throw new Error(`Ошибка получения токенов для проекта ${projectId}`);
        }
        return response.json() as Promise<BotToken[]>;
      },
      staleTime: 30000, // 30 секунд
      enabled: !!projectId, // Выполняем запрос только если projectId определен
    })),
  });

  // Формируем результат
  return results.map((result, index) => ({
    projectId: projectIds[index],
    tokens: result.data || [],
  })).filter(item => item.tokens !== undefined);
}