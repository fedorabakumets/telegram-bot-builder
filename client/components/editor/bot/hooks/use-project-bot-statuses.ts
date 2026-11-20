/** @fileoverview Чтение состояния исполнителя ботов из общего кэша проекта. */
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import type { BotStatusResponse } from '../bot-types';
import { projectBotStatusesQueryKey } from '../project-bot-statuses-query';

/**
 * Загружает состояние исполнителя для отображения в шапках проекта.
 * @param projectId - Проект выбранных ботов.
 * @returns Запрос общего списка состояний.
 */
export function useProjectBotStatuses(projectId: number) {
  const queryKey = projectBotStatusesQueryKey(projectId);
  return useQuery<{ /** Состояния процессов и связи с исполнителем. */ statuses: BotStatusResponse[] }>({
    queryKey,
    queryFn: () => apiRequest('GET', queryKey[0]),
    enabled: projectId > 0,
    staleTime: 10_000,
  });
}
