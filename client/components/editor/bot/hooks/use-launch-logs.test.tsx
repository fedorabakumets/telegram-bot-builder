/** @fileoverview Проверка ошибок истории запуска, повторной загрузки и сохранения ранее полученных строк. */
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import { useLaunchLogs } from './use-launch-logs';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

/** Создаёт независимый запрос без автоматических повторов и фоновых таймеров. */
function setupLaunch(launchId: number | undefined) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return renderHook(() => useLaunchLogs(launchId), {
    /** Предоставляет каждому тесту отдельный кэш. */
    wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });
}

/** Формирует успешный ответ API с безопасными тестовыми данными. */
const response = (rows: unknown[]) => ({ ok: true, json: async () => rows });
const rows = [{ id: 17, type: 'stderr', content: 'Проверочная строка', timestamp: '2026-11-23T15:57:00Z' }];

it('отличает HTTP-ошибку от пустого запуска и позволяет повторить загрузку', async () => {
  const fetch = vi.fn().mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce(response(rows));
  vi.stubGlobal('fetch', fetch);
  const hook = setupLaunch(8970);
  await waitFor(() => expect(hook.result.current.isError).toBe(true));
  expect(hook.result.current.logs).toEqual([]);
  expect(hook.result.current.isLoading).toBe(false);
  act(() => hook.result.current.retry());
  await waitFor(() => expect(hook.result.current.logs).toEqual(rows));
  expect(hook.result.current.isError).toBe(false);
  expect(fetch).toHaveBeenCalledWith('/api/launch/8970/logs', expect.objectContaining({
    credentials: 'include', signal: expect.any(AbortSignal),
  }));
});

it('сохраняет загруженные строки, если обновление завершилось сетевой ошибкой', async () => {
  const fetch = vi.fn().mockResolvedValueOnce(response(rows)).mockRejectedValueOnce(new Error('Нет связи'));
  vi.stubGlobal('fetch', fetch);
  const hook = setupLaunch(8970);
  await waitFor(() => expect(hook.result.current.logs).toEqual(rows));
  act(() => hook.result.current.retry());
  await waitFor(() => expect(hook.result.current.isError).toBe(true));
  expect(hook.result.current.logs).toEqual(rows);
  expect(hook.result.current.isLoading).toBe(false);
});

it('считает успешный пустой ответ пустым запуском без ошибки', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response([])));
  const hook = setupLaunch(8970);
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
  expect(hook.result.current.logs).toEqual([]);
  expect(hook.result.current.isError).toBe(false);
});

it('показывает обновление отдельно от первой загрузки и не очищает строки', async () => {
  let resolveRefresh!: (value: ReturnType<typeof response>) => void;
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response(rows)).mockImplementationOnce(
    () => new Promise(resolve => { resolveRefresh = resolve; }),
  ));
  const hook = setupLaunch(8970);
  await waitFor(() => expect(hook.result.current.logs).toEqual(rows));
  act(() => hook.result.current.retry());
  await waitFor(() => expect(hook.result.current.isRefreshing).toBe(true));
  expect(hook.result.current.isLoading).toBe(false);
  expect(hook.result.current.logs).toEqual(rows);
  await act(async () => resolveRefresh(response(rows)));
  await waitFor(() => expect(hook.result.current.isRefreshing).toBe(false));
});

it('не запрашивает историю без выбранного идентификатора запуска', () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  setupLaunch(undefined);
  expect(fetch).not.toHaveBeenCalled();
});
