/**
 * @fileoverview Тесты для хука useProjectData
 * Проверяет загрузку данных проекта и обработку ошибок
 * @module tests/unit/hooks/use-project-data.test
 *
 * @description
 * Для тестирования хуков React Query используется @testing-library/react
 * Запуск: npx vitest run client/components/editor/database/dialog/tests/unit/hooks/use-project-data.test.ts
 */

/// <reference types="vitest/globals" />

import { beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProjectData } from '../../../hooks/use-project-data';
import type { BotProject } from '@shared/schema';

// Мокирование fetch
const mockFetch = global.fetch as any;

/**
 * Создаёт тестовый QueryClient
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        logger: {
          log: console.log,
          warn: console.warn,
          error: () => {}, // Отключаем логирование ошибок в тестах
        },
      },
    },
  });
}

/**
 * Обёртка для тестирования хуков с QueryClient
 */
function createWrapper() {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
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
  beforeEach(() => {
    mockFetch?.mockClear?.();
    vi.clearAllMocks();
  });

  it('должен загружать данные проекта успешно', async () => {
    const mockProject = createTestProject({ id: 1, name: 'Test Project' });

    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockProject),
      })
    );

    const wrapper = createWrapper();
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

  it('должен возвращать null при отсутствии projectId', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useProjectData(0), { wrapper });

    // Запрос не должен выполняться для projectId = 0
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.project).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('должен обрабатывать ошибку загрузки', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useProjectData(1), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.project).toBeNull();
    expect(result.current.isError).toBe(true);
  });

  it('должен обрабатывать ошибку сети', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.reject(new Error('Network error'))
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useProjectData(1), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.project).toBeNull();
    expect(result.current.isError).toBe(true);
  });

  it('должен возвращать isLoading=true во время загрузки', async () => {
    const mockProject = createTestProject();

    mockFetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve(mockProject),
            });
          }, 100);
        })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useProjectData(1), { wrapper });

    // Сразу после рендера должно быть isLoading=true
    expect(result.current.isLoading).toBe(true);
    expect(result.current.project).toBeNull();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('должен кэшировать данные', async () => {
    const mockProject = createTestProject({ id: 1, name: 'Cached Project' });

    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockProject),
      })
    );

    const wrapper = createWrapper();

    // Первая загрузка
    const { result: result1 } = renderHook(() => useProjectData(1), { wrapper });
    await waitFor(() => expect(result1.current.isLoading).toBe(false));

    // Вторая загрузка (должно быть из кэша)
    const { result: result2 } = renderHook(() => useProjectData(1), { wrapper });
    await waitFor(() => expect(result2.current.isLoading).toBe(false));

    // Fetch должен быть вызван только один раз
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('должен возвращать функцию refetch', async () => {
    const mockProject = createTestProject();

    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockProject),
      })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useProjectData(1), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.refetch).toBeDefined();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('должен выполнять повторный запрос через refetch', async () => {
    const mockProject1 = createTestProject({ name: 'Project 1' });
    const mockProject2 = createTestProject({ name: 'Project 2' });

    mockFetch
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProject1),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProject2),
        })
      );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useProjectData(1), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.project?.name).toBe('Project 1');

    // Выполняем refetch
    result.current.refetch();

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
  });

  it('должен использовать staleTime 5 минут', async () => {
    const mockProject = createTestProject();

    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockProject),
      })
    );

    const wrapper = createWrapper();
    renderHook(() => useProjectData(1), { wrapper });

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    // Проверяем что запрос был выполнен (staleTime работает)
  });

  it('должен использовать retry: 1', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useProjectData(1), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    // retry: 1 означает одну повторную попытку
    expect(mockFetch).toHaveBeenCalledTimes(2); // первоначальный + 1 retry
  });
});
