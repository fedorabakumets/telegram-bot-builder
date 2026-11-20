/** @fileoverview Проверяет решение о повторе запроса первоначальной настройки. */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useSetupBootstrap } from './use-setup';

const fetchBootstrap = vi.fn();

beforeEach(() => {
  fetchBootstrap.mockReset();
  vi.stubGlobal('fetch', fetchBootstrap);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/**
 * Вызывает проверку состояния с отдельным кэшем запросов.
 * @returns Результат тестового вызова хука.
 */
function renderBootstrap() {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } });
  /** Передаёт отдельный кэш тестируемому хуку. */
  function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return renderHook(useSetupBootstrap, { wrapper: Wrapper });
}

it('повторяет временный HTTP 503 и возвращает подтверждённый ответ', async () => {
  fetchBootstrap.mockResolvedValueOnce(new Response(null, { status: 503 }))
    .mockResolvedValueOnce(Response.json({ configured: true, adminEnabled: true }));
  const { result } = renderBootstrap();
  await waitFor(() => expect(result.current.data).toEqual({ configured: true, adminEnabled: true }), { timeout: 3000 });
  expect(fetchBootstrap).toHaveBeenCalledTimes(2);
});

it('не повторяет HTTP 403 и оставляет ошибку для ручной проверки', async () => {
  fetchBootstrap.mockResolvedValueOnce(new Response(null, { status: 403 }));
  const { result } = renderBootstrap();
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(fetchBootstrap).toHaveBeenCalledTimes(1);
});

it('не принимает ответ без признака доступности управления', async () => {
  fetchBootstrap.mockResolvedValueOnce(Response.json({ configured: false }));
  const { result } = renderBootstrap();
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(result.current.data).toBeUndefined();
  expect(fetchBootstrap).toHaveBeenCalledTimes(1);
});

it('отменяет зависший запрос и повторяет проверку, не повторяя отмену при размонтировании', async () => {
  vi.useFakeTimers();
  fetchBootstrap.mockImplementation((_url: string, { signal }: RequestInit) => new Promise((_resolve, reject) => {
    signal?.addEventListener('abort', () => reject(signal.reason), { once: true });
  }));
  const { unmount } = renderBootstrap();
  const first = fetchBootstrap.mock.calls[0][1] as RequestInit;
  expect(first.cache).toBe('no-store');

  await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
  expect(first.signal?.aborted).toBe(true);
  await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
  expect(fetchBootstrap).toHaveBeenCalledTimes(2);

  const second = fetchBootstrap.mock.calls[1][1] as RequestInit;
  unmount();
  expect(second.signal?.aborted).toBe(true);
  await vi.advanceTimersByTimeAsync(30_000);
  expect(fetchBootstrap).toHaveBeenCalledTimes(2);
});
