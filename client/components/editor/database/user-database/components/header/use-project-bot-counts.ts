/** @fileoverview Количество ботов каждого проекта без загрузки списков секретных токенов. */
import { useQuery } from '@tanstack/react-query';
/**
 * Читает общую метрику одним запросом для селекторов проекта.
 * @param enabled - Есть ли проекты в текущей панели.
 * @returns Карта количеств без подмены загрузки нулём.
 */
export function useProjectBotCounts(enabled: boolean): Map<number, number> {
  const { data } = useQuery<Array<{ /** Проект. */ id: number; /** Количество ботов. */ botCount: number }>>({
    queryKey: ['/api/projects/list', 'bot-counts'],
    queryFn: async () => {
      const response = await fetch('/api/projects/list?includeBotCounts=true', { credentials: 'include' });
      if (!response.ok) throw new Error('Не удалось загрузить количество ботов');
      return response.json();
    }, enabled, staleTime: 30_000,
  });
  return new Map((data ?? []).map(project => [project.id, project.botCount]));
}
