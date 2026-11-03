/**
 * @fileoverview Хук загрузки проекта редактора
 *
 * Управляет загрузкой данных проекта по ID или выбором первого из списка.
 * Гости и новые пользователи видят пустой экран без проектов.
 */

import { useQuery } from '@tanstack/react-query';
import type { BotProject } from '@shared/schema';
import { useTelegramAuth } from '@/components/editor/header/hooks/use-telegram-auth';
import { apiRequest } from '@/queryClient';
import type { BotProjectWithArchive } from '@/components/editor/sidebar/hooks/use-projects-query';

/** Параметры хука загрузки проекта */
interface UseProjectLoaderOptions {
  /** ID проекта из URL */
  projectId: number | null;
}

/** Результат работы хука загрузки проекта */
interface UseProjectLoaderResult {
  /** Данные текущего проекта */
  currentProject: BotProjectWithArchive | undefined;
  /** Данные первого проекта из списка */
  firstProject: BotProjectWithArchive | undefined;
  /** Список активных проектов (только метаданные) */
  projectsList: Array<Omit<BotProject, 'data'> & { isArchivedForMe?: boolean }> | undefined;
  /** Эффективный ID проекта (из URL или первый в списке) */
  effectiveProjectId: number | undefined;
  /** Флаг ошибки загрузки проекта */
  isProjectNotFound: boolean;
}

/**
 * Хук для загрузки данных проекта.
 * Ждёт готовности серверной сессии перед запросом проектов.
 *
 * @param options - Параметры загрузки
 * @returns Результат загрузки проекта
 */
export function useProjectLoader({
  projectId
}: UseProjectLoaderOptions): UseProjectLoaderResult {
  const { sessionReady } = useTelegramAuth();

  // Загрузка проекта по ID из URL — ждём сессии
  const { data: currentProject, isError: projectNotFound } = useQuery<BotProjectWithArchive>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId && sessionReady,
    staleTime: 30000,
  });

  const { data: projectsList } = useQuery<Array<Omit<BotProject, 'data'> & { isArchivedForMe?: boolean }>>({
    queryKey: ['/api/projects/list', 'active'],
    queryFn: () => apiRequest('GET', '/api/projects/list?archived=false'),
    enabled: !projectId && sessionReady,
    staleTime: 30000,
  });

  const needArchivedFallback = !projectId && sessionReady && projectsList !== undefined && projectsList.length === 0;

  const { data: archivedProjectsList } = useQuery<Array<Omit<BotProject, 'data'> & { isArchivedForMe?: boolean }>>({
    queryKey: ['/api/projects/list', 'archived'],
    queryFn: () => apiRequest('GET', '/api/projects/list?archived=true'),
    enabled: needArchivedFallback,
    staleTime: 30000,
  });

  // Эффективный ID: активный первый, иначе первый из архива
  const effectiveProjectId =
    projectId ||
    projectsList?.[0]?.id ||
    archivedProjectsList?.[0]?.id;

  // Загрузка первого проекта если нет ID в URL
  const { data: firstProject } = useQuery<BotProjectWithArchive>({
    queryKey: [`/api/projects/${effectiveProjectId}`],
    enabled: !projectId && !!effectiveProjectId && sessionReady,
    staleTime: 30000,
  });

  return {
    currentProject,
    firstProject,
    projectsList,
    effectiveProjectId,
    isProjectNotFound: projectNotFound
  };
}
