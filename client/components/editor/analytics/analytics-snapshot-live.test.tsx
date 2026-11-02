/** @fileoverview Проверки согласованного периода и живого обновления без периодического опроса. */
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { initialReportFilter } from './analytics-report-filter';
import { useAnalyticsSnapshot } from './use-analytics-snapshot';
/** Управляемые обработчики транспорта. */
const live = vi.hoisted(() => ({ message: null as null | ((event: unknown) => void), reconnect: null as null | (() => void) }));
vi.mock('@/lib/shared-terminal-ws', () => ({
  subscribeSharedTerminalWs: (listener: (event: unknown) => void) => { live.message = listener; return () => { live.message = null; }; },
  onSharedTerminalWsReconnect: (listener: () => void) => { live.reconnect = listener; return () => { live.reconnect = null; }; },
  getSharedTerminalWsState: () => 'connected', getSharedAnalyticsBridgeState: () => true, subscribeSharedTerminalWsState: () => () => {},
}));
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
/** Создаёт изолированный кэш для одной проверки. */
function context() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const requests: string[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string) => { requests.push(url); return { ok: true, json: async () => ({ schema_version: 2, revision: String(requests.length), next_recompute_at: null }) }; }));
  const wrapper = ({ children }: { /** Проверяемый хук. */ children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, requests, wrapper };
}
it('меняет область и период одним запросом без старого снимка под новым фильтром', async () => {
  const { client, requests, wrapper } = context();
  const filter = initialReportFilter(12);
  const hook = renderHook(({ period, tokenId }: { /** Период. */ period: '7d' | '30d'; /** Бот. */ tokenId: number | null }) => useAnalyticsSnapshot(12, tokenId, { ...filter, period }), { initialProps: { period: '30d' as '7d' | '30d', tokenId: 7 as number | null }, wrapper });
  await waitFor(() => expect(hook.result.current.isSuccess).toBe(true));
  expect(requests[0]).toContain('period=30d'); expect(requests[0]).toContain('tokenId=7');
  hook.rerender({ period: '7d', tokenId: null });
  expect(hook.result.current.data).toBeUndefined();
  await waitFor(() => expect(requests).toHaveLength(2));
  expect(requests[1]).toContain('period=7d'); expect(requests[1]).not.toContain('tokenId=');
  expect(client.getQueryCache().getAll().every(query => !('refetchInterval' in query.options))).toBe(true);
  hook.unmount(); client.clear();
});
it('принимает события своего проекта и восстанавливает снимок при reconnect', async () => {
  const { client, requests, wrapper } = context();
  const hook = renderHook(() => useAnalyticsSnapshot(12, 7, initialReportFilter(12)), { wrapper });
  await waitFor(() => expect(hook.result.current.isSuccess).toBe(true));
  act(() => { live.message?.({ type: 'analytics-changed', projectId: 99, tokenId: 7 }); live.message?.({ type: 'analytics-changed', projectId: 12, tokenId: 8 }); });
  await new Promise(resolve => setTimeout(resolve, 300)); expect(requests).toHaveLength(1);
  act(() => { live.message?.({ type: 'analytics-changed', projectId: 12, tokenId: 7 }); live.message?.({ type: 'analytics-changed', projectId: 12, tokenId: 7 }); });
  await waitFor(() => expect(requests).toHaveLength(2));
  act(() => live.reconnect?.()); await waitFor(() => expect(requests).toHaveLength(3));
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  act(() => document.dispatchEvent(new Event('visibilitychange'))); await waitFor(() => expect(requests).toHaveLength(4));
  hook.unmount(); client.clear(); expect(live.message).toBeNull();
});
it('обновляет скользящее окно по границе даже без новых событий', async () => {
  const { client, requests, wrapper } = context();
  const filter = initialReportFilter(12);
  const hook = renderHook(() => useAnalyticsSnapshot(12, 7, filter), { wrapper });
  await waitFor(() => expect(hook.result.current.isSuccess).toBe(true));
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  await act(async () => {
    client.setQueryData(['analytics-v2', 12, 7, JSON.stringify(filter)], { schema_version: 2, revision: '1', next_recompute_at: new Date(Date.now() + 2000).toISOString() });
    await vi.advanceTimersByTimeAsync(1);
  });
  await act(async () => { await vi.advanceTimersByTimeAsync(2200); });
  expect(requests).toHaveLength(2);
  hook.unmount(); client.clear();
});
