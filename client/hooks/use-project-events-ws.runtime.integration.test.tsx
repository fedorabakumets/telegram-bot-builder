/** @fileoverview Проверки обновления режима бота через настоящую подписку WebSocket и кэш запросов. */
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useProjectEventsWs } from './use-project-events-ws';
import { useBotRuntimeSettings, type BotRuntimeSettings } from '@/components/editor/bot/card/use-bot-runtime-settings';

/** Управляемое соединение вместо внешнего сервера событий. */
class TestSocket {
  /** Созданные подключения. */
  static instances: TestSocket[] = [];
  /** Обработчик открытия. */
  onopen: (() => void) | null = null;
  /** Обработчик сообщения. */
  onmessage: ((event: { data: string }) => void) | null = null;
  /** Обработчик разрыва. */
  onclose: (() => void) | null = null;
  /** Обработчик ошибки. */
  onerror: (() => void) | null = null;
  /** Регистрирует новое подключение. */
  constructor() { TestSocket.instances.push(this); }
  /** Закрывает тестовое подключение без повторного вызова обработчика. */
  close() {}
  /** Передаёт событие изменения режима без секретов и значения режима. */
  updated() { this.onmessage?.({ data: JSON.stringify({ type: 'token-updated', projectId: 901, tokenId: 902, data: { changedFields: ['BOT_POLLING_MODE'] } }) }); }
}

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); TestSocket.instances = []; });

/**
 * Создаёт независимый клиент кэша и подключает реальные хуки чтения и событий.
 * @returns Серверное состояние, кэш и результат подключения.
 */
function setup() {
  let saved: BotRuntimeSettings = { mode: 'direct', source: 'bot', launchMode: 'polling', requiresRestart: true };
  const fetchMock = vi.fn(async (..._args: unknown[]): Promise<{ ok: boolean; json: () => Promise<unknown> }> => ({ ok: true, json: async () => ({ ...saved }) }));
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('WebSocket', TestSocket);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const hook = renderHook(() => { useProjectEventsWs(901); return useBotRuntimeSettings(901, 902); }, {
    /** Передаёт тестовый кэш реальным хукам. */
    wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });
  return { hook, client, fetchMock, save: (mode: BotRuntimeSettings['mode']) => { saved = { ...saved, mode }; } };
}

describe('сквозное обновление режима бота', () => {
  it('после события другой вкладки перечитывает сохранённый режим с сервера', async () => {
    const test = setup();
    await waitFor(() => expect(test.hook.result.current.query.data?.mode).toBe('direct'));
    test.save('process');
    act(() => TestSocket.instances[0].updated());
    await waitFor(() => expect(test.hook.result.current.query.data?.mode).toBe('process'));
    expect(test.fetchMock).toHaveBeenCalledTimes(2);
    expect(test.client.getQueryState(['/api/projects/901/tokens/902/env-variables'])?.data).toBeUndefined();
  });

  it('после реконнекта получает изменение, пропущенное при разрыве связи', async () => {
    const test = setup();
    await waitFor(() => expect(test.hook.result.current.query.data?.mode).toBe('direct'));
    act(() => TestSocket.instances[0].onopen?.());
    test.save('ondemand');
    vi.useFakeTimers();
    act(() => TestSocket.instances[0].onclose?.());
    act(() => vi.advanceTimersByTime(3000));
    expect(TestSocket.instances).toHaveLength(2);
    act(() => TestSocket.instances[1].onopen?.());
    vi.useRealTimers();
    await waitFor(() => expect(test.hook.result.current.query.data?.mode).toBe('ondemand'));
    expect(test.fetchMock).toHaveBeenCalledTimes(2);
  });

  it('после повторного открытия читает сохранённое значение заново', async () => {
    const test = setup();
    await waitFor(() => expect(test.hook.result.current.query.data?.mode).toBe('direct'));
    test.hook.unmount();
    test.save('process');
    test.client.clear();
    const reopened = renderHook(() => useBotRuntimeSettings(901, 902), {
      /** Подключает повторно открытую форму к тому же клиенту. */
      wrapper: ({ children }) => <QueryClientProvider client={test.client}>{children}</QueryClientProvider>,
    });
    await waitFor(() => expect(reopened.result.current.query.data?.mode).toBe('process'));
  });

  it('при отказе сохранения оставляет подтверждённый сервером режим', async () => {
    const test = setup();
    await waitFor(() => expect(test.hook.result.current.query.data?.mode).toBe('direct'));
    test.fetchMock.mockImplementationOnce(async () => ({ ok: false, json: async () => ({ message: 'Недостаточно прав' }) }));
    await act(async () => {
      await expect(test.hook.result.current.mutation.mutateAsync('process')).rejects.toThrow('Недостаточно прав');
    });
    expect(test.hook.result.current.query.data?.mode).toBe('direct');
    expect(test.fetchMock.mock.calls[test.fetchMock.mock.calls.length - 1]).toEqual(['/api/projects/901/tokens/902/runtime-settings', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'process' }),
    }]);
  });
});
