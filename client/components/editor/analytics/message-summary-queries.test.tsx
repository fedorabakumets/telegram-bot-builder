/** @fileoverview Проверки одинакового периода направлений и уникальных собеседников без фонового опроса. */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, type QueryObserverOptions } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { useMessagesActivity } from '../database/user-database/hooks/queries/use-messages-activity';
import { useUsersActivity } from '../database/user-database/hooks/queries/use-users-activity';

afterEach(() => vi.unstubAllGlobals());

/** Проверяет запросы короткого и длинного окна, смену бота и уникальность за целое окно. */
it('меняет период и область обоих запросов вместе и не включает polling', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const requests: string[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    requests.push(url);
    return { ok: true, json: async () => url.includes('/messages/')
      ? [{ date: '2026-11-02', incoming: 3, outgoing: 5 }]
      : { points: [{ date: '2026-11-01', total: 2 }, { date: '2026-11-02', total: 2 }], activeInWindow: 2, newInWindow: 0 } };
  }));
  /** Изолирует кэш проверяемой карточки. */
  const wrapper = ({ children }: { /** Дочерние хуки. */ children: ReactNode }) =>
    <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const hook = renderHook(({ granularity, selectedTokenId }: { /** Период. */ granularity: '1m' | '1d'; /** Бот. */ selectedTokenId: number | null }) => ({
    messages: useMessagesActivity({ projectId: 12, selectedTokenId, granularity, split: true, liveOnly: true }),
    users: useUsersActivity({ projectId: 12, selectedTokenId, granularity, liveOnly: true }),
  }), { initialProps: { granularity: '1m' as '1m' | '1d', selectedTokenId: 7 as number | null }, wrapper });
  await waitFor(() => expect(hook.result.current.users.isLoading).toBe(false));
  expect(requests.every(url => url.includes('granularity=1m') && url.includes('tokenId=7'))).toBe(true);
  expect(requests.find(url => url.includes('/messages/'))).toContain('split=true');
  expect(hook.result.current.users.activeInWindow).toBe(2);
  hook.rerender({ granularity: '1d', selectedTokenId: null });
  await waitFor(() => expect(requests).toHaveLength(4));
  await waitFor(() => expect(hook.result.current.messages.isLoading).toBe(false));
  expect(requests.slice(2).every(url => url.includes('granularity=1d') && !url.includes('tokenId='))).toBe(true);
  expect(client.getQueryCache().getAll().every(query => (query.options as QueryObserverOptions).refetchInterval === false)).toBe(true);
  expect(hook.result.current.messages.points[0].count).toBe(3);
  expect(hook.result.current.messages.outgoingPoints[0].count).toBe(5);
  hook.unmount();
  client.clear();
});
