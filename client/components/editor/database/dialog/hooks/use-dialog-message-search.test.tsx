/** @fileoverview Проверка поиска по всей переписке, курсоров и смены собеседника. */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { useDialogMessageSearch } from './use-dialog-message-search';

/** Создаёт изолированный кэш без автоматического повторения запросов. */
function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  /** Передаёт тестируемому хуку отдельный кэш. */
  return function Wrapper({ children }: { /** Дочерний хук. */ children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}
beforeEach(() => vi.mocked(fetch).mockReset());

/** Общий поиск сохраняет слово и период, не подставляя токен бота для ответа. */
it('ищет по всем ботам личного чата без токена и сохраняет период', async () => {
  vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ messages: [{ id: 42 }], next_cursor: null }) } as Response);
  const period = { messageFrom: '2026-11-05T04:00:00.000+03:00', messageTo: '2026-11-05T05:00:00.000+03:00' };
  const { result } = renderHook(() => useDialogMessageSearch(13, null, '123', 'private', 'скрыт', period, true), { wrapper: createWrapper() });
  await waitFor(() => expect(result.current.targetId).toBe(42));
  const url = new URL(String(vi.mocked(fetch).mock.calls[0][0]), 'http://localhost');
  expect(url.searchParams.get('allBots')).toBe('true');
  expect(url.searchParams.has('tokenId')).toBe(false);
  expect(url.searchParams.get('query')).toBe('скрыт');
  expect(url.searchParams.get('messageFrom')).toBe(period.messageFrom);
  expect(url.searchParams.get('messageTo')).toBe(period.messageTo);
});

it('переходит между совпадениями и подгружает более старую страницу', async () => {
  vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => ({ messages: [{ id: 90 }, { id: 70 }], next_cursor: 'older' }) } as Response)
    .mockResolvedValueOnce({ ok: true, json: async () => ({ messages: [{ id: 20 }], next_cursor: null }) } as Response);
  const { result } = renderHook(() => useDialogMessageSearch(13, 11, '123', 'private', 'скрыт'), { wrapper: createWrapper() });
  await waitFor(() => expect(result.current.targetId).toBe(90));
  await act(() => result.current.next());
  expect(result.current.targetId).toBe(70);
  await act(() => result.current.next());
  await waitFor(() => expect(result.current.targetId).toBe(20));
  expect(result.current.count).toBe(3);
  expect(String(vi.mocked(fetch).mock.calls[1][0])).toContain('cursor=older');
  expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain('chatId=123&chatType=private');
  act(() => result.current.previous());
  expect(result.current.targetId).toBe(70);
  act(() => result.current.close());
  expect(result.current.visible).toBe(false);
  expect(result.current.targetId).toBeNull();
});

it('не переносит выбранное сообщение и закрытое состояние в другой чат', async () => {
  vi.mocked(fetch).mockImplementation(async input => ({ ok: true,
    json: async () => ({ messages: [{ id: String(input).includes('chatId=456') ? 200 : 100 }], next_cursor: null }) }) as Response);
  const { result, rerender } = renderHook(({ chatId }) => useDialogMessageSearch(13, 11, chatId, 'private', 'скрыт'),
    { initialProps: { chatId: '123' }, wrapper: createWrapper() });
  await waitFor(() => expect(result.current.targetId).toBe(100));
  act(() => result.current.close());
  rerender({ chatId: '456' });
  expect(result.current.visible).toBe(true);
  await waitFor(() => expect(result.current.targetId).toBe(200));
});

it('не запрашивает пустой поиск и отличает ошибку от отсутствия совпадений', async () => {
  const { result, rerender } = renderHook(({ query }) => useDialogMessageSearch(13, 11, '123', 'private', query),
    { initialProps: { query: '' }, wrapper: createWrapper() });
  expect(fetch).not.toHaveBeenCalled();
  vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);
  rerender({ query: 'скрыт' });
  await waitFor(() => expect(result.current.failed).toBe(true));
  vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => ({ messages: [], next_cursor: null }) } as Response);
  act(() => result.current.retry());
  await waitFor(() => expect(result.current.failed).toBe(false));
  expect(result.current.targetId).toBeNull();
  expect(result.current.count).toBe(0);
});
