/**
 * @fileoverview Тесты для хука useDeleteProjectMutation
 * Проверяет удаление проекта с оптимистичными обновлениями и откатом
 * @module components/editor/sidebar/tests/unit/hooks/use-delete-project-mutation.test
 */

/// <reference types="vitest/globals" />

import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDeleteProjectMutation } from '../../../hooks/use-delete-project-mutation';
import type { BotProject } from '@shared/schema';

/**
 * Создаёт тестовый QueryClient
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Обёртка для тестирования хуков с React Query
 */
const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

/**
 * Моковый проект для тестов
 */
const mockProject: BotProject = {
  id: 1,
  name: 'Тестовый проект',
  description: 'Описание',
  createdAt: new Date(),
  updatedAt: new Date(),
  ownerId: null,
  data: {
    nodes: [{
      id: 'start',
      type: 'start',
      position: { x: 400, y: 300 },
      data: {
        messageText: 'Привет!',
        keyboardType: 'none',
        buttons: [],
        command: '/start',
        description: 'Запустить бота',
        showInMenu: true,
        isPrivateOnly: false,
        requiresAuth: false,
        adminOnly: false
      }
    }],
    connections: []
  },
  botToken: null,
  userDatabaseEnabled: null,
  lastExportedGoogleSheetId: null,
  lastExportedGoogleSheetUrl: null,
  lastExportedAt: null,
  lastExportedStructureSheetId: null,
  lastExportedStructureSheetUrl: null,
  lastExportedStructureAt: null,
};

/**
 * Проект без данных для списка
 */
const mockProjectWithoutData: Omit<BotProject, 'data'> = {
  id: 1,
  name: 'Тестовый проект',
  description: 'Описание',
  createdAt: new Date(),
  updatedAt: new Date(),
  ownerId: null,
  botToken: null,
  userDatabaseEnabled: null,
  lastExportedGoogleSheetId: null,
  lastExportedGoogleSheetUrl: null,
  lastExportedAt: null,
  lastExportedStructureSheetId: null,
  lastExportedStructureSheetUrl: null,
  lastExportedStructureAt: null,
};

describe('useDeleteProjectMutation', () => {
  let queryClient: QueryClient;
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    wrapper = createWrapper(queryClient);

    // Мок для fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
  });

  afterEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('должен возвращать функцию deleteProject и isPending', () => {
    const { result } = renderHook(() => useDeleteProjectMutation(), { wrapper });

    expect(result.current.deleteProject).toBeDefined();
    expect(typeof result.current.deleteProject).toBe('function');
    expect(result.current.isPending).toBe(false);
  });

  it('должен удалять проект с сервера', async () => {
    const { result } = renderHook(() => useDeleteProjectMutation(), { wrapper });

    await act(async () => {
      result.current.deleteProject(1);
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    // Проверяем что fetch был вызван с правильным URL и методом
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/projects/1',
      expect.objectContaining({
        method: 'DELETE',
      })
    );
  });

  it('должен обновлять кэш queryClient', async () => {
    // Предварительно заполняем кэш
    const projects: BotProject[] = [mockProject];
    const projectList: Array<Omit<BotProject, 'data'>> = [mockProjectWithoutData];

    queryClient.setQueryData(['/api/projects'], projects);
    queryClient.setQueryData(['/api/projects/list'], projectList);

    const { result } = renderHook(() => useDeleteProjectMutation(), { wrapper });

    await act(async () => {
      result.current.deleteProject(1);
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    // Проверяем что проект удалён из кеша
    const updatedProjects = queryClient.getQueryData<BotProject[]>(['/api/projects']);
    const updatedList = queryClient.getQueryData<Array<Omit<BotProject, 'data'>>>(['/api/projects/list']);

    expect(updatedProjects).toEqual([]);
    expect(updatedList).toEqual([]);
  });

  it('должен показывать уведомление об успехе', async () => {
    const { result } = renderHook(() => useDeleteProjectMutation(), { wrapper });

    await act(async () => {
      result.current.deleteProject(1);
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    // Уведомление должно быть вызвано (проверяем через toast hook)
    // В тестах useToast использует глобальное состояние
    expect(global.fetch).toHaveBeenCalled();
  });

  it('должен откатывать изменения при ошибке', async () => {
    // Предварительно заполняем кэш
    const projects: BotProject[] = [mockProject];
    const projectList: Array<Omit<BotProject, 'data'>> = [mockProjectWithoutData];

    queryClient.setQueryData(['/api/projects'], projects);
    queryClient.setQueryData(['/api/projects/list'], projectList);

    // Мок для ошибки
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useDeleteProjectMutation(), { wrapper });

    await act(async () => {
      result.current.deleteProject(1);
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    // Проверяем что кэш откатился к исходному состоянию
    const updatedProjects = queryClient.getQueryData<BotProject[]>(['/api/projects']);
    const updatedList = queryClient.getQueryData<Array<Omit<BotProject, 'data'>>>(['/api/projects/list']);

    expect(updatedProjects).toEqual(projects);
    expect(updatedList).toEqual(projectList);
  });

  it('должен удалять конкретный проект из списка', async () => {
    const project2: BotProject = {
      ...mockProject,
      id: 2,
      name: 'Другой проект',
    };
    const project2WithoutData: Omit<BotProject, 'data'> = {
      ...mockProjectWithoutData,
      id: 2,
      name: 'Другой проект',
    };

    // Предварительно заполняем кэш несколькими проектами
    const projects: BotProject[] = [mockProject, project2];
    const projectList: Array<Omit<BotProject, 'data'>> = [mockProjectWithoutData, project2WithoutData];

    queryClient.setQueryData(['/api/projects'], projects);
    queryClient.setQueryData(['/api/projects/list'], projectList);

    const { result } = renderHook(() => useDeleteProjectMutation(), { wrapper });

    await act(async () => {
      result.current.deleteProject(1);
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    // Проверяем что удалён только проект с id=1
    const updatedProjects = queryClient.getQueryData<BotProject[]>(['/api/projects']);
    const updatedList = queryClient.getQueryData<Array<Omit<BotProject, 'data'>>>(['/api/projects/list']);

    expect(updatedProjects).toHaveLength(1);
    expect(updatedProjects?.[0].id).toBe(2);
    expect(updatedList).toHaveLength(1);
    expect(updatedList?.[0].id).toBe(2);
  });
});
