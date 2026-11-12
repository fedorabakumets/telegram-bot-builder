/** @fileoverview Загрузка страниц ботов с поиском и обновлением только видимой вкладки. */
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { WorkerBotRuntimePage } from '@shared/worker-bot-runtime';
import { apiRequest } from '@/queryClient';

/** Загружает список независимо от формы общих настроек, сохраняя поисковый ввод. */
export function useWorkerBots() {
  const [search, setSearch] = useState('');
  const [activity, setActivity] = useState('enabled');
  const [mode, setMode] = useState('all');
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);
  const params = new URLSearchParams({ search: debouncedSearch, mode, activity, page: String(page), pageSize: '25' });
  const url = `/admin/api/runtime-settings/workers/bots?${params}`;
  const query = useQuery<WorkerBotRuntimePage>({
    queryKey: ['/admin/api/runtime-settings/workers/bots', debouncedSearch, mode, activity, page],
    queryFn: () => apiRequest('GET', url),
    staleTime: 5_000,
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });
  useEffect(() => {
    if (query.data && page > Math.max(1, Math.ceil(query.data.total / query.data.pageSize))) setPage(1);
  }, [query.data, page]);
  /** Сбрасывает страницу сразу при вводе нового поиска. */
  const changeSearch = (value: string) => { setSearch(value); setPage(1); };
  /** Применяет режим ко всему серверному списку. */
  const changeMode = (value: string) => { setMode(value); setPage(1); };
  /** Включает остановленных ботов и возвращает первую страницу. */
  const changeActivity = (value: string) => { setActivity(value); setPage(1); };
  return { ...query, activity, changeActivity, search, mode, page, setPage, changeSearch, changeMode, searching: search.trim() !== debouncedSearch };
}
