/** @fileoverview Проверки ленивой загрузки истории, курсоров и инвалидирования сохранений. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { usePagedProjectVersions } from './use-paged-project-versions';

/** Создаёт независимый клиент и обёртку контекста запросов. */
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  /** Передаёт клиент тестируемому хуку. */
  const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children);
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [{ id: 101 }], total: 50, nextCursor: 'opaque+cursor' }) });
  vi.stubGlobal('fetch', fetch);
  return { client, wrapper, fetch };
}

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('ленивая постраничная история', () => {
  it('не читает закрытую историю даже после инвалидирования; открытие запускает запрос', async () => {
    const { client, wrapper, fetch } = setup();
    const { result, rerender } = renderHook(({ open }) => usePagedProjectVersions(12, open), { wrapper, initialProps: { open: false } });
    await act(async () => { await client.invalidateQueries({ queryKey: ['/api/projects', 12, 'versions'] }); });
    expect(fetch).not.toHaveBeenCalled();
    rerender({ open: true });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetch).toHaveBeenCalledWith('/api/projects/12/versions?limit=25', expect.objectContaining({ credentials: 'include', signal: expect.any(AbortSignal) }));
  });

  it('передаёт курсор следующей страницы и сбрасывает его при смене проекта и размера', async () => {
    const { wrapper, fetch } = setup();
    const { result, rerender } = renderHook(({ id }) => usePagedProjectVersions(id), { wrapper, initialProps: { id: 12 } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    act(() => result.current.onPageChange(2));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetch).toHaveBeenLastCalledWith('/api/projects/12/versions?limit=25&cursor=opaque%2Bcursor', expect.anything());
    rerender({ id: 15 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.page).toBe(1);
    expect(fetch).toHaveBeenLastCalledWith('/api/projects/15/versions?limit=25', expect.anything());
    act(() => result.current.setPageSize(50));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetch).toHaveBeenLastCalledWith('/api/projects/15/versions?limit=50', expect.anything());
  });

  it('после сохранения или восстановления возвращает начало истории', async () => {
    const { client, wrapper } = setup();
    const { result } = renderHook(() => usePagedProjectVersions(12), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    act(() => result.current.onPageChange(2));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.page).toBe(2);
    await act(async () => { await client.invalidateQueries({ queryKey: ['/api/projects', 12, 'versions'] }); });
    await waitFor(() => expect(result.current.page).toBe(1));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('показывает ошибку доступа и позволяет повторить запрос', async () => {
    const { wrapper, fetch } = setup();
    fetch.mockResolvedValueOnce({ ok: false, status: 403 });
    const { result } = renderHook(() => usePagedProjectVersions(12), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    await act(async () => { await result.current.refetch(); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('не делает запрос за последней страницей', async () => {
    const { wrapper, fetch } = setup();
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [{ id: 101 }], total: 1, nextCursor: null }) });
    const { result } = renderHook(() => usePagedProjectVersions(12), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    act(() => result.current.onPageChange(2));
    expect(result.current.page).toBe(1);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('возвращается при удалении последней страницы', async () => {
    const { wrapper, fetch } = setup();
    const { result } = renderHook(() => usePagedProjectVersions(12), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [], total: 25, nextCursor: null }) });
    act(() => result.current.onPageChange(2));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.page).toBe(1));
  });
});
