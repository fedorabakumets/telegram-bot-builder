/** @fileoverview Рекламная таблица не исчезает при живом сдвиге окна и не показывает старые значения при смене фильтра. */
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';
import { useAcquisitionReport } from './use-acquisition';
const request = vi.hoisted(() => vi.fn());
vi.mock('./use-analytics-snapshot', () => ({ analyticsJson: request }));
/** Создаёт независимый кэш и обёртку для проверки жизненного цикла запросов. */
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  /** Предоставляет кэш проверяемому запросу. */
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
}
const range = { from: '2026-10-26T01:00:00Z', to: '2026-11-02T01:00:00Z', timezone: 'UTC', period: '7d' };
it('сохраняет таблицу при фоновом сдвиге периода, но очищает её при смене валюты', async () => {
  request.mockReset().mockResolvedValueOnce({ rows: [], asOf: range.to }).mockImplementation(() => new Promise(() => {}));
  const { client, wrapper } = setup();
  const hook = renderHook(({ currentRange, currency }) => useAcquisitionReport(12, 9, currentRange, currency, false), { wrapper, initialProps: { currentRange: range, currency: 'RUB' } });
  await waitFor(() => expect(hook.result.current.isSuccess).toBe(true));
  const previous = hook.result.current.data;
  hook.rerender({ currentRange: { ...range, from: '2026-10-26T01:01:00Z', to: '2026-11-02T01:01:00Z' }, currency: 'RUB' });
  expect(hook.result.current.data).toBe(previous);
  expect(hook.result.current.isLoading).toBe(false);
  hook.rerender({ currentRange: range, currency: 'USD' });
  expect(hook.result.current.data).toBeUndefined();
  hook.unmount(); client.clear();
});
it('полный срок не создаёт новый запрос при сдвиге общего периода', async () => {
  request.mockReset().mockResolvedValue({ rows: [], asOf: range.to });
  const { client, wrapper } = setup();
  const hook = renderHook(({ currentRange }) => useAcquisitionReport(12, 9, currentRange, 'RUB', true), { wrapper, initialProps: { currentRange: range } });
  await waitFor(() => expect(hook.result.current.isSuccess).toBe(true));
  hook.rerender({ currentRange: { ...range, from: '2026-10-03T01:00:00Z', to: '2026-11-02T01:01:00Z', period: '30d' } });
  expect(hook.result.current.isLoading).toBe(false);
  expect(request).toHaveBeenCalledTimes(1);
  hook.unmount(); client.clear();
});
