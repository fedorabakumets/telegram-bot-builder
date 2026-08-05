/**
 * @fileoverview Тесты useAuthMeQuery (дедупликация GET /api/auth/me)
 * @module components/editor/header/hooks/use-auth-me-query.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import {
  fetchAuthMe,
  useAuthMeQuery,
} from './use-auth-me-query';

/**
 * Создаёт QueryClient для изолированных тестов
 * @returns Новый QueryClient без retry
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
}

describe('fetchAuthMe', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('нормализует snake_case в camelCase', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({ user: { id: 1, first_name: 'A' } }),
      }),
    );

    const user = await fetchAuthMe();
    expect(user).toMatchObject({ id: 1, firstName: 'A' });
  });

  it('возвращает null при user: null', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({ user: null }),
      }),
    );

    expect(await fetchAuthMe()).toBeNull();
  });
});

describe('useAuthMeQuery', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /**
   * Обёртка с QueryClientProvider для renderHook
   * @param props - children
   * @returns JSX
   */
  function wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  }

  it('два mount — один fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ user: { id: 1, firstName: 'A' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const hook1 = renderHook(() => useAuthMeQuery(), { wrapper });
    const hook2 = renderHook(() => useAuthMeQuery(), { wrapper });

    await waitFor(() => expect(hook1.result.current.isSuccess).toBe(true));
    await waitFor(() => expect(hook2.result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(hook1.result.current.data).toMatchObject({ id: 1, firstName: 'A' });
    expect(hook2.result.current.data).toMatchObject({ id: 1, firstName: 'A' });
  });

  it('ошибка сети — isError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));

    const { result } = renderHook(() => useAuthMeQuery(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });
});
