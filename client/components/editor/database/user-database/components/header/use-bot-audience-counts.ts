/** @fileoverview Общий быстрый кэш аудитории ботов без загрузки графиков аналитики. */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
/** Счётчик подтверждённой аудитории одного бота. */
interface AudienceCount {
  /** ID бота в проекте. */ token_id: number;
  /** Количество пользователей, включая явный ноль. */ total_users: number;
}
/** Загружает все числа одним запросом и сохраняет их между вкладками. @param projectId - Текущий проект. @returns Полная карта аудитории и состояние запроса. */
export function useBotAudienceCounts(projectId: number) {
  const query = useQuery<AudienceCount[]>({
    queryKey: [`/api/projects/${projectId}/bot-audience-counts`],
    queryFn: () => apiRequest('GET', `/api/projects/${projectId}/bot-audience-counts`),
    enabled: projectId > 0, staleTime: 30_000, gcTime: 600_000, refetchInterval: 30_000,
  });
  const counts = useMemo(() => new Map(query.data?.map(item => [item.token_id, item.total_users]) ?? []), [query.data]);
  return { ...query, counts };
}
