/** @fileoverview Чтение и сохранение режима получения обновлений по умолчанию. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import { toast } from '@/hooks/use-toast';
import type { LaunchMode } from '../card/bot-launch-helpers';

/** Настройка проекта и распределение подключённых ботов. */
interface ProjectLaunchDefault {
  /** Режим, который наследуют боты проекта. */
  launchMode: LaunchMode;
  /** Число ботов, использующих режим проекта. */
  inheritedCount: number;
  /** Число ботов, для которых режим задан отдельно. */
  overrideCount: number;
}

/**
 * Формирует адрес настройки и ключ её кэша.
 * @param projectId - Идентификатор проекта.
 * @returns Адрес настройки.
 */
function launchDefaultUrl(projectId: number) {
  return `/api/projects/${projectId}/bot/launch-default`;
}

/**
 * Загружает сохранённое значение режима.
 * @param projectId - Идентификатор проекта.
 * @returns Результат запроса настройки и счётчиков.
 */
export function useBotProjectLaunchDefault(projectId: number) {
  const url = launchDefaultUrl(projectId);
  return useQuery<ProjectLaunchDefault>({ queryKey: [url], queryFn: () => apiRequest('GET', url) });
}

/**
 * Сохраняет режим проекта и обновляет данные в карточках ботов.
 * @param projectId - Идентификатор проекта.
 * @returns Мутация сохранения настройки.
 */
export function useSaveBotProjectLaunchDefault(projectId: number) {
  const url = launchDefaultUrl(projectId);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (launchMode: LaunchMode): Promise<ProjectLaunchDefault> =>
      apiRequest('PUT', url, { launchMode }),
    onSuccess: (data) => {
      /** Режим сохранён для следующего запуска. */
      toast({ title: 'Режим запуска сохранён', description: 'Применится при следующем запуске.' });
      queryClient.setQueryData([url], data);
      void queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      void queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      void queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] });
      void queryClient.invalidateQueries({
        predicate: ({ queryKey: [key] }) => typeof key === 'string'
          && key.startsWith(`/api/projects/${projectId}/tokens/`) && key.endsWith('/runtime-settings'),
      });
    },
  });
}
