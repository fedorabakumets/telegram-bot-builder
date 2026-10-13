/**
 * @fileoverview Проверки изоляции истории, пагинации и возврата в живые логи.
 */
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from '@/queryClient';
import { useTerminalPeriod } from './use-terminal-period';

vi.mock('@/queryClient', () => ({ apiRequest: vi.fn() }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
/** Живая строка, которая не должна проникать в исторический диапазон. */
const live = [{ id: '900', content: 'Живой поток', type: 'stdout' as const, timestamp: new Date() }];

/**
 * Подключает тестируемый хук к отдельному кэшу запросов.
 * @returns Хук с управлением периодом
 */
function setupPeriod() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderHook(() => useTerminalPeriod(289, 301, live), {
    /** Передаёт отдельный кэш для независимой проверки истории. */
    wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });
}

describe('история логов за период', () => {
  it('запрашивает историю с границами и возвращает живой поток без подмешивания', async () => {
    vi.mocked(apiRequest).mockResolvedValue([{ id: 10, content: 'История', type: 'stdout', timestamp: '2026-10-10T10:00:00Z' }]);
    const hook = setupPeriod();
    expect(hook.result.current.lines).toEqual(live);
    expect(apiRequest).not.toHaveBeenCalled();
    act(() => hook.result.current.selectCustom({ from: '2026-10-10T00:00:00Z', to: '2026-10-11T00:00:00Z' }));
    await waitFor(() => expect(hook.result.current.lines[0]?.id).toBe('10'));
    expect(hook.result.current.lines.some(line => line.id === '900')).toBe(false);
    const url = String(vi.mocked(apiRequest).mock.calls[0][1]);
    expect(url).toContain('/api/projects/289/tokens/301/logs?');
    const params = new URL(url, 'http://localhost').searchParams;
    expect(params.get('from')).toBe('2026-10-10T00:00:00Z');
    expect(params.get('to')).toBe('2026-10-11T00:00:00Z');
    act(() => hook.result.current.selectPeriod('live'));
    expect(hook.result.current.lines).toEqual(live);
    expect(hook.result.current.range).toBeNull();
  });
  it('загружает более ранние строки по минимальному id страницы и сортирует по времени', async () => {
    const page = Array.from({ length: 500 }, (_, index) => ({ id: index + 100,
      content: `Лог ${index}`, type: 'stdout', timestamp: '2026-10-10T10:00:00Z' }));
    vi.mocked(apiRequest).mockResolvedValueOnce(page).mockResolvedValueOnce([
      { id: 99, content: 'Ранний лог', type: 'stderr', timestamp: '2026-10-10T09:00:00Z' },
    ]);
    const hook = setupPeriod();
    act(() => hook.result.current.selectPeriod('24h'));
    await waitFor(() => expect(hook.result.current.hasMore).toBe(true));
    act(() => hook.result.current.loadMore());
    await waitFor(() => expect(hook.result.current.lines.length).toBe(501));
    expect(String(vi.mocked(apiRequest).mock.calls[1][1])).toContain('beforeId=100');
    expect(hook.result.current.lines[0].id).toBe('99');
    expect(hook.result.current.hasMore).toBe(false);
  });
  it('сообщает об ошибке запроса без отображения живого потока как истории', async () => {
    vi.mocked(apiRequest).mockRejectedValue(new Error('Сервер недоступен'));
    const hook = setupPeriod();
    act(() => hook.result.current.selectPeriod('yesterday'));
    await waitFor(() => expect(hook.result.current.error).toBeTruthy());
    expect(hook.result.current.lines).toEqual([]);
    expect(hook.result.current.isLoading).toBe(false);
  });
});
