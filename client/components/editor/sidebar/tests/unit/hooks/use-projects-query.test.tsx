/**
 * @fileoverview Тесты для хука useProjectsQuery
 * Проверяет загрузку списка проектов
 * @module components/editor/sidebar/tests/unit/hooks/use-projects-query.test
 */

/// <reference types="vitest/globals" />

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProjectsQuery } from '../../../hooks/use-projects-query';
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
 * Моковые данные проектов
 */
const mockProjects: BotProject[] = [
  {
    id: 1,
    name: 'Test Project 1',
    description: 'Test Description 1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ownerId: null,
    data: {},
    botToken: null,
    userDatabaseEnabled: null,
    lastExportedGoogleSheetId: null,
    lastExportedGoogleSheetUrl: null,
    lastExportedAt: null,
    lastExportedStructureSheetId: null,
    lastExportedStructureSheetUrl: null,
    lastExportedStructureAt: null,
  },
  {
    id: 2,
    name: 'Test Project 2',
    description: 'Test Description 2',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    ownerId: null,
    data: {},
    botToken: null,
    userDatabaseEnabled: null,
    lastExportedGoogleSheetId: null,
    lastExportedGoogleSheetUrl: null,
    lastExportedAt: null,
    lastExportedStructureSheetId: null,
    lastExportedStructureSheetUrl: null,
    lastExportedStructureAt: null,
  },
];

describe('useProjectsQuery', () => {
  let queryClient: QueryClient;
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    wrapper = createWrapper(queryClient);
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('должен возвращать пустой массив при начальной загрузке', async () => {
    const { result } = renderHook(() => useProjectsQuery(), { wrapper });

    expect(result.current.projects).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });

  it('должен загружать проекты с сервера', async () => {
    // Мок для fetch
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockProjects,
    });

    const { result } = renderHook(() => useProjectsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.projects).toHaveLength(2);
    expect(result.current.projects[0].name).toBe('Test Project 1');
    expect(result.current.projects[1].name).toBe('Test Project 2');
  });

  it('должен возвращать isLoading=false после загрузки', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockProjects,
    });

    const { result } = renderHook(() => useProjectsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('должен предоставлять функцию refetch', () => {
    const { result } = renderHook(() => useProjectsQuery(), { wrapper });

    expect(result.current.refetch).toBeDefined();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('должен обрабатывать пустой список проектов', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const { result } = renderHook(() => useProjectsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.projects).toEqual([]);
    expect(result.current.projects).toHaveLength(0);
  });

  it('должен обрабатывать ошибку загрузки', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useProjectsQuery(), { wrapper });

    // Хук не должен падать, должен вернуть пустой массив
    await waitFor(() => {
      expect(result.current.projects).toEqual([]);
    });
  });
});
