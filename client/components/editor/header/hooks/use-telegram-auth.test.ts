/**
 * @fileoverview Тесты useTelegramAuth (mount /me, login, logout, дедуп)
 * @module components/editor/header/hooks/use-telegram-auth.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';

const { testQueryClient } = vi.hoisted(() => {
  const { QueryClient } = require('@tanstack/react-query');
  return {
    testQueryClient: new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    }),
  };
});

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/queryClient', () => ({
  queryClient: testQueryClient,
}));

vi.mock('@/utils/invalidate-auth-queries', () => ({
  invalidateAuthQueries: vi.fn(),
  clearUserCache: vi.fn(),
}));

import { useTelegramAuth } from './use-telegram-auth';
import { clearUserCache } from '@/utils/invalidate-auth-queries';

describe('useTelegramAuth', () => {
  beforeEach(() => {
    testQueryClient.clear();
    vi.clearAllMocks();
    localStorage.clear();
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
    return createElement(QueryClientProvider, { client: testQueryClient }, children);
  }

  it('на mount вызывает GET /api/auth/me', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ user: { id: 1, firstName: 'A' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useTelegramAuth(), { wrapper });

    await waitFor(() => expect(result.current.sessionReady).toBe(true));
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/me', expect.objectContaining({
      credentials: 'include',
    }));
    expect(result.current.user).toMatchObject({ id: 1, firstName: 'A' });
  });

  it('два mount — один GET /api/auth/me', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ user: { id: 1, firstName: 'A' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const hook1 = renderHook(() => useTelegramAuth(), { wrapper });
    const hook2 = renderHook(() => useTelegramAuth(), { wrapper });

    await waitFor(() => expect(hook1.result.current.sessionReady).toBe(true));
    await waitFor(() => expect(hook2.result.current.sessionReady).toBe(true));

    const meCalls = fetchMock.mock.calls.filter(
      (call) => call[0] === '/api/auth/me',
    );
    expect(meCalls).toHaveLength(1);
  });

  it('login делает POST и выставляет user', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        json: async () => ({ user: null }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          success: true,
          switched: false,
          user: { id: 42, firstName: 'Bob' },
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useTelegramAuth(), { wrapper });
    await waitFor(() => expect(result.current.sessionReady).toBe(true));

    await act(async () => {
      await result.current.login({ id: 42, firstName: 'Bob', idToken: 'tok' });
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/telegram',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"id_token":"tok"'),
      }),
    );
    await waitFor(() =>
      expect(result.current.user).toMatchObject({ id: 42, firstName: 'Bob' }),
    );
  });

  it('logout вызывает POST /api/auth/logout и чистит user', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        json: async () => ({ user: { id: 1, firstName: 'A' } }),
      })
      .mockResolvedValueOnce({
        json: async () => ({ success: true }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useTelegramAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).toMatchObject({ id: 1 }));

    await act(async () => {
      await result.current.logout();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/logout',
      expect.objectContaining({ method: 'POST' }),
    );
    await waitFor(() => expect(result.current.user).toBeNull());
  });

  it('login B при user A очищает cache', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        json: async () => ({ user: { id: 1, firstName: 'A' } }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          success: true,
          switched: true,
          user: { id: 2, firstName: 'B' },
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useTelegramAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).toMatchObject({ id: 1 }));

    await act(async () => {
      await result.current.login({ id: 2, firstName: 'B' });
    });

    expect(clearUserCache).toHaveBeenCalled();
    await waitFor(() =>
      expect(result.current.user).toMatchObject({ id: 2, firstName: 'B' }),
    );
  });
});
