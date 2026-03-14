/**
 * @fileoverview Тесты для хука useProjectData
 * Проверяет загрузку данных проекта и обработку ошибок
 * @module tests/unit/hooks/use-project-data.test
 */

/// <reference types="vitest/globals" />

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProjectData } from '../../../hooks/use-project-data';
import type { BotProject } from '@shared/schema';

// Мокируем fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockClear();
  vi.clearAllMocks();
});

/**
 * Создаёт тестовый QueryClient с default queryFn
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        queryFn: async ({ queryKey }) => {
          const res = await mockFetch(queryKey[0] as string);
          if (!res.ok) {
            throw new Error(`${res.status}: ${res.statusText}`);
          }
          return res.json();
        },
      },
    },
  });
}

/**
 * Создаёт тестовый проект
 */
function createTestProject(overrides: Partial<BotProject> = {}): BotProject {
  return {
    id: 1,
    name: 'Test Project',
    token: 'test-token',
    data: {},
    createdAt: new Date('2024-03-14T10:30:00Z'),
    updatedAt: new Date('2024-03-14T10:30:00Z'),
    ...overrides,
  } as BotProject;
}

describe('useProjectData', () => {
  it('должен возвращать null при отсутствии projectId', async () => {
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    
    const { result } = renderHook(() => useProjectData(0), { wrapper });

    // Запрос не должен выполняться для projectId = 0
    expect(result.current.isLoading).toBe(false);
    expect(result.current.project).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('должен загружать данные проекта успешно', async () => {
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const mockProject = createTestProject({ id: 1, name: 'Test Project' });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProject,
    } as any);

    const { result } = renderHook(() => useProjectData(1), { wrapper });

    // Начальное состояние
    expect(result.current.isLoading).toBe(true);
    expect(result.current.project).toBeNull();
    expect(result.current.isError).toBe(false);

    // Ожидаем загрузку
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.project).toEqual(mockProject);
    expect(result.current.isError).toBe(false);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/projects/1')
    );
  });

  it('должен обрабатывать ошибку загрузки', async () => {
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as any);

    const { result } = renderHook(() => useProjectData(1), { wrapper });

    // Ожидаем завершения загрузки
    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 5000 });
    expect(result.current.project).toBeNull();
    expect(result.current.isError).toBe(true);
  });

  it('должен обрабатывать ошибку сети', async () => {
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useProjectData(1), { wrapper });

    // Ожидаем завершения загрузки
    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 5000 });
    expect(result.current.project).toBeNull();
    expect(result.current.isError).toBe(true);
  });

  it('должен кэшировать данные', async () => {
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const mockProject = createTestProject({ id: 1, name: 'Cached Project' });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProject,
    } as any);

    // Первая загрузка
    const { result: result1 } = renderHook(() => useProjectData(1), { wrapper });
    await waitFor(() => expect(result1.current.isLoading).toBe(false));

    // Вторая загрузка (должно быть из кэша)
    const { result: result2 } = renderHook(() => useProjectData(1), { wrapper });
    expect(result2.current.isLoading).toBe(false);
    expect(result2.current.project).toEqual(mockProject);

    // Fetch должен быть вызван только один раз
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('должен возвращать функцию refetch', async () => {
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const mockProject = createTestProject();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProject,
    } as any);

    const { result } = renderHook(() => useProjectData(1), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.refetch).toBeDefined();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('должен выполнять повторный запрос через refetch', async () => {
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const mockProject1 = createTestProject({ name: 'Project 1' });
    const mockProject2 = createTestProject({ name: 'Project 2' });

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProject1,
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProject2,
      } as any);

    const { result } = renderHook(() => useProjectData(1), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.project?.name).toBe('Project 1');

    // Выполняем refetch
    result.current.refetch();

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
  });
});
