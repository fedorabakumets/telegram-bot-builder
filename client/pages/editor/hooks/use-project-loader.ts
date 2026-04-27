/**
 * @fileoverview Хук загрузки проекта редактора
 *
 * Управляет загрузкой данных проекта по ID или выбором первого из списка.
 * Ожидает готовности серверной сессии перед первым запросом к API.
 * При пустом списке проектов автоматически создаёт дефолтный проект.
 */

import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { BotProject } from '@shared/schema';
import { useTelegramAuth } from '@/components/editor/header/hooks/use-telegram-auth';
import { isTelegramUser } from '@/types/telegram-user';
import { apiRequest } from '@/queryClient';

/** Параметры хука загрузки проекта */
interface UseProjectLoaderOptions {
  /** ID проекта из URL */
  projectId: number | null;
}

/** Результат работы хука загрузки проекта */
interface UseProjectLoaderResult {
  /** Данные текущего проекта */
  currentProject: BotProject | undefined;
  /** Данные первого проекта из списка */
  firstProject: BotProject | undefined;
  /** Список проектов (только метаданные) */
  projectsList: Array<Omit<BotProject, 'data'>> | undefined;
  /** Эффективный ID проекта (из URL или первый в списке) */
  effectiveProjectId: number | undefined;
  /** Флаг ошибки загрузки проекта */
  isProjectNotFound: boolean;
}

/** Стартовые данные нового проекта по умолчанию — новый формат с sheets */
const DEFAULT_PROJECT_DATA = {
  version: 2,
  activeSheetId: 'sheet-1',
  sheets: [
    {
      id: 'sheet-1',
      name: 'Лист 1',
      nodes: [
        {
          id: 'start-message',
          type: 'message' as const,
          position: { x: 400, y: 300 },
          data: {
            messageText: 'Привет! Я ваш новый бот. Нажмите /help для получения помощи.',
            keyboardType: 'none' as const,
            buttons: [],
            showInMenu: true,
          },
        },
        {
          id: 'start-command-trigger',
          type: 'command_trigger' as const,
          position: { x: 100, y: 300 },
          data: {
            command: '/start',
            description: 'Запустить бота',
            showInMenu: true,
            autoTransitionTo: 'start-message',
            sourceNodeId: 'start-message',
          },
        },
      ],
      connections: [],
    },
  ],
};

/**
 * Хук для загрузки данных проекта.
 * Ждёт готовности серверной сессии чтобы проекты создавались с правильным owner_id.
 * Если список проектов пустой — автоматически создаёт первый проект.
 *
 * @param options - Параметры загрузки
 * @returns Результат загрузки проекта
 */
export function useProjectLoader({
  projectId
}: UseProjectLoaderOptions): UseProjectLoaderResult {
  const { sessionReady, user } = useTelegramAuth();
  const queryClient = useQueryClient();
  const isCreatingRef = useRef(false);
  /** Авторизованный пользователь — не создаём проект автоматически, у него должны быть свои */
  const isAuthenticated = user !== null && isTelegramUser(user);

  // Загрузка проекта по ID из URL
  const { data: currentProject, isError: projectNotFound } = useQuery<BotProject>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId && sessionReady,
    staleTime: 30000,
  });

  // Загрузка списка проектов если нет ID в URL — ждём сессии
  const { data: projectsList } = useQuery<Array<Omit<BotProject, 'data'>>>({
    queryKey: ['/api/projects/list'],
    enabled: !projectId && sessionReady,
    staleTime: 30000,
  });

  // Автосоздание дефолтного проекта если список пустой (только для гостей)
  useEffect(() => {
    if (!sessionReady) return;
    if (projectId) return;
    if (projectsList === undefined) return; // ещё грузится
    if (projectsList.length > 0) return;    // проекты есть
    if (isCreatingRef.current) return;      // уже создаём
    if (isAuthenticated) return;            // авторизованный — не создаём автоматически

    isCreatingRef.current = true;
    apiRequest('POST', '/api/projects', {
      name: 'Новый бот 1',
      description: '',
      data: DEFAULT_PROJECT_DATA,
    })
      .then((newProject: BotProject) => {
        queryClient.setQueryData<Array<Omit<BotProject, 'data'>>>(['/api/projects/list'], [newProject]);
        queryClient.setQueryData<BotProject[]>(['/api/projects'], [newProject]);
        queryClient.setQueryData<BotProject>([`/api/projects/${newProject.id}`], newProject);
        // Инвалидируем чтобы сайдбар подхватил новый проект
        queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      })
      .catch(e => {
        console.error('Ошибка автосоздания проекта:', e);
        isCreatingRef.current = false;
      });
  }, [sessionReady, projectId, projectsList, queryClient]);

  // Эффективный ID проекта
  const effectiveProjectId = projectId || projectsList?.[0]?.id;

  // Загрузка первого проекта если нет ID в URL
  const { data: firstProject } = useQuery<BotProject>({
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
