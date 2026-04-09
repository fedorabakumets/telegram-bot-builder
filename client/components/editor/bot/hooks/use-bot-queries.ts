/**
 * @fileoverview Хук для запросов данных ботов
 *
 * Инкапсулирует все useQuery/useQueries вызовы для панели управления ботами:
 * - Список проектов
 * - Токены по каждому проекту
 * - Статусы ботов по каждому токену
 * - Информация о ботах (getMe) по каждому проекту
 *
 * @module use-bot-queries
 */

import { useMemo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import { type BotProject, BotToken } from '@shared/schema';
import type { BotStatusResponse } from '../bot-types';
import type { BotInfo } from '../profile/BotProfileEditor';

/**
 * Результат хука запросов ботов
 */
export interface BotQueriesResult {
  /** Список проектов */
  projects: BotProject[];
  /** Загружаются ли проекты */
  projectsLoading: boolean;
  /** Токены по каждому проекту (индекс совпадает с projects) */
  allTokens: BotToken[][];
  /** Все токены в плоском массиве с projectId */
  allTokensFlat: (BotToken & { projectId: number })[];
  /** Статусы ботов */
  allBotStatuses: BotStatusResponse[];
  /** Информация о ботах из Telegram API */
  allBotInfos: (BotInfo | undefined)[];
  /** Функции для ручного обновления статусов */
  refetchStatuses: () => void;
}

/**
 * Хук для получения всех данных ботов
 */
export function useBotQueries(): BotQueriesResult {
  const { data: projects = [], isLoading: projectsLoading } = useQuery<BotProject[]>({
    queryKey: ['/api/projects'],
    queryFn: () => apiRequest('GET', '/api/projects'),
  });

  const tokensResults = useQueries({
    queries: projects.map(project => ({
      queryKey: [`/api/projects/${project.id}/tokens`],
      queryFn: () => apiRequest('GET', `/api/projects/${project.id}/tokens`),
      enabled: projects.length > 0,
    })),
  });

  const allTokens: BotToken[][] = tokensResults
    .map(q => q.data || [])
    .filter((data): data is BotToken[] => Array.isArray(data) && data.length > 0);

  const allTokensFlat = useMemo(
    () =>
      allTokens.flatMap((tokens, idx) =>
        tokens.map(token => ({ ...token, projectId: projects[idx]?.id })),
      ),
    [allTokens, projects],
  );

  const statusResults = useQueries({
    queries: allTokensFlat.map(token => ({
      queryKey: [`/api/tokens/${token.id}/bot-status`],
      queryFn: () => apiRequest('GET', `/api/tokens/${token.id}/bot-status`),
      refetchInterval: 3000,
      refetchIntervalInBackground: true,
      staleTime: 1000,
    })),
  });

  const allBotStatuses = statusResults
    .map((q, idx) => q.data ? { ...q.data, tokenId: allTokensFlat[idx]?.id } : null)
    .filter(Boolean) as BotStatusResponse[];

  const botInfoResults = useQueries({
    queries: projects.map(project => ({
      queryKey: [`/api/projects/${project.id}/bot/info`],
      queryFn: () => apiRequest('GET', `/api/projects/${project.id}/bot/info`),
      enabled: projects.length > 0,
      refetchInterval: allBotStatuses.some(s => s?.status === 'running') ? 60000 : false,
      refetchIntervalInBackground: false,
      staleTime: 30000,
      // Сохраняем предыдущие данные при рефетче — аватарки не мигают
      placeholderData: (prev: BotInfo | undefined) => prev,
    })),
  });

  // Не фильтруем undefined — сохраняем индексы в соответствии с projects
  const allBotInfos = botInfoResults.map(q => q.data ?? undefined) as (BotInfo | undefined)[];

  const refetchStatuses = () => {
    statusResults.forEach(q => q.refetch());
  };

  return {
    projects,
    projectsLoading,
    allTokens,
    allTokensFlat,
    allBotStatuses,
    allBotInfos,
    refetchStatuses,
  };
}
