/** @fileoverview Постраничная загрузка метаданных истории только при открытии интерфейса. */
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProjectVersionMeta } from './use-project-versions';

/** Ответ ограниченной выборки истории без снимков. */
export interface ProjectVersionsPage {
  /** Метаданные текущей страницы. */
  items: ProjectVersionMeta[];
  /** Непрозрачный указатель следующей страницы. */
  nextCursor: string | null;
  /** Число сохранённых версий проекта. */
  total: number;
}

/**
 * Загружает одну страницу, передавая авторизацию и сигнал отмены.
 * @param projectId - Проект
 * @param limit - Максимум записей
 * @param cursor - Указатель продолжения
 * @param signal - Отмена запроса при смене проекта или страницы
 * @returns Метаданные страницы
 */
export async function fetchProjectVersionsPage(projectId: number, limit: number, cursor: string | null, signal?: AbortSignal): Promise<ProjectVersionsPage> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  const response = await fetch(`/api/projects/${projectId}/versions?${params}`, { credentials: 'include', signal });
  if (!response.ok) throw new Error('Не удалось загрузить историю версий');
  return response.json();
}

/**
 * Хранит только текущую страницу и курсоры посещённых страниц.
 * @param projectId - Проект
 * @param enabled - Открыта ли история
 * @returns Страница, навигация и состояния запроса
 */
export function usePagedProjectVersions(projectId: number, enabled = true) {
  const queryClient = useQueryClient();
  const [pageSize, setPageSize] = useState(25);
  const [navigation, setNavigation] = useState({ projectId, pageSize, page: 1, cursors: [null] as Array<string | null> });
  const current = navigation.projectId === projectId && navigation.pageSize === pageSize
    ? navigation : { projectId, pageSize, page: 1, cursors: [null] as Array<string | null> };
  useEffect(() => {
    setNavigation({ projectId, pageSize, page: 1, cursors: [null] });
  }, [projectId, pageSize]);
  const cursor = current.cursors[current.page - 1];
  const query = useQuery({
    queryKey: ['/api/projects', projectId, 'versions', 'page', pageSize, cursor],
    queryFn: ({ signal }) => fetchProjectVersionsPage(projectId, pageSize, cursor, signal),
    enabled: enabled && projectId > 0,
    staleTime: 10000,
  });
  useEffect(() => queryClient.getQueryCache().subscribe(event => {
    const key = event.query.queryKey;
    if (event.type === 'updated' && event.action.type === 'invalidate'
      && key[0] === '/api/projects' && key[1] === projectId && key[2] === 'versions') {
      setNavigation({ projectId, pageSize, page: 1, cursors: [null] });
    }
  }), [queryClient, projectId, pageSize]);
  useEffect(() => {
    if (query.data && !query.data.items.length && current.page > 1) {
      setNavigation({ projectId, pageSize, page: 1, cursors: [null] });
    }
  }, [query.data, current.page, projectId, pageSize]);
  /** Переключает только на посещённую либо следующую доступную страницу. */
  const onPageChange = (page: number) => {
    if (page < 1 || page > current.page + 1 || query.isFetching) return;
    const cursors = current.cursors.slice(0, current.page);
    if (page > current.page) {
      if (!query.data?.nextCursor) return;
      cursors.push(query.data.nextCursor);
    }
    setNavigation({ ...current, page, cursors });
  };
  return { ...query, page: current.page, pageSize, setPageSize, onPageChange };
}
