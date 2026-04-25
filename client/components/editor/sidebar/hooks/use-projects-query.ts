/**
 * @fileoverview Хук для загрузки списка проектов
 * Предоставляет данные о проектах и состояние загрузки
 * @module components/editor/sidebar/hooks/use-projects-query
 */

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import type { BotProject } from '@shared/schema';
import { useTelegramAuth } from '@/components/editor/header/hooks/use-telegram-auth';

/**
 * Результат работы хука загрузки проектов
 */
export interface UseProjectsQueryResult {
  /** Список проектов */
  projects: BotProject[];
  /** Индикатор загрузки */
  isLoading: boolean;
  /** Функция для принудительного обновления данных */
  refetch: () => void;
}

/**
 * Хук для получения списка проектов с сервера.
 * Ожидает готовности серверной сессии перед первым запросом,
 * чтобы не получить пустой список до авторизации.
 *
 * @returns Объект с данными о проектах и состоянием
 */
export function useProjectsQuery(): UseProjectsQueryResult {
  const { sessionReady } = useTelegramAuth();

  const { data, isLoading, refetch } = useQuery<BotProject[]>({
    queryKey: ['/api/projects'],
    queryFn: () => apiRequest('GET', '/api/projects'),
    staleTime: 0, // Данные всегда считаются устаревшими
    enabled: sessionReady, // Ждём готовности серверной сессии
  });

  // Рефетч при появлении sessionReady — подхватывает проекты созданные автоматически
  useEffect(() => {
    if (sessionReady) {
      refetch();
    }
  }, [sessionReady]);

  return {
    projects: data || [],
    isLoading,
    refetch,
  };
}
