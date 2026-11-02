/** @fileoverview Обновление активных графиков текущего проекта с понятным состоянием ошибки. */
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/** Ключи статистики, числовые параметры которых начинаются с проекта. */
const ANALYTICS_KEYS = new Set(['users-growth', 'users-growth-by-source', 'messages-activity',
  'users-activity', 'activity-leaders', 'popular-buttons', 'groups-analytics-stats', 'groups-analytics-growth', 'bot-table-chart']);

/**
 * Повторно загружает активные графики, включая аудиторию, группы и таблицы.
 * @param projectId - Проект текущей вкладки.
 * @returns Обработчик обновления, занятость и сообщение ошибки.
 */
export function useAnalyticsRefresh(projectId: number) {
  const client = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  /** Повторяет только запросы статистики текущего проекта. */
  const refresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setError('');
    try {
      await client.refetchQueries({ type: 'active', predicate: query => {
        const [key, id] = query.queryKey;
        return (typeof key === 'string' && ANALYTICS_KEYS.has(key) && id === projectId)
          || (typeof key === 'string' && key.startsWith(`/api/projects/${projectId}/users/`)
            && /\/(stats|traffic)(\?|$)/.test(key));
      } }, { throwOnError: true });
    } catch {
      setError('Не удалось обновить часть графиков. Проверьте соединение и повторите загрузку.');
    } finally { setRefreshing(false); }
  };
  return { refresh, refreshing, error };
}
