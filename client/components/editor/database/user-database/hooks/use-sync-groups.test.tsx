/**
 * @fileoverview Проверки исключения бота, повторных запросов и изоляции токенов.
 */
import { createElement, type ReactNode } from 'react';
import { act, cleanup, render, renderHook, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UserBotData } from '@shared/schema';
import { requestGroupSync } from './group-sync-request';
import { useSyncGroups } from './use-sync-groups';
import { GroupAccessStatus } from '../dialogs-tab/group-access-status';

/** Тестовый диалог с ранее сохранённым названием группы. */
const group = { userId: '-1004465403276', firstName: 'Наш чат', isGroup: true } as unknown as UserBotData;

/**
 * Создаёт ответ запроса синхронизации без обращения к Telegram.
 * @param error - Описание ошибки или отсутствие ошибки
 * @returns Имитированный ответ сервера
 */
function response(error?: string) {
  return { ok: !error, json: async () => ({ error }) };
}

/**
 * Создаёт отдельный клиент запросов для каждого теста хука.
 * @returns Обёртка провайдера
 */
function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  /**
   * Подключает тестовый клиент запросов.
   * @param props - Дочерние компоненты
   * @returns Провайдер запросов
   */
  return function Wrapper({ children }: {
    /** Дочерние компоненты теста. */
    children: ReactNode;
  }) {
    return createElement(QueryClientProvider, { client }, children);
  };
}

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('Проверка доступа к группе', () => {
  it('отличает исключение от отсутствующего чата и сетевой ошибки', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response('Forbidden: bot was kicked from the supergroup chat'))
      .mockResolvedValueOnce(response('Bad Request: chat not found'))
      .mockRejectedValueOnce(new Error('Нет сети'));
    vi.stubGlobal('fetch', fetchMock);
    expect(await requestGroupSync(12, group.userId, 9)).toBe('kicked');
    expect(await requestGroupSync(12, group.userId, 9)).toBe('error');
    expect(await requestGroupSync(12, group.userId, 9)).toBe('error');
    expect(fetchMock.mock.calls[0][0]).toContain('?tokenId=9');
  });

  it('не повторяет неудачный запрос при рендерах и снимает метку после ручной проверки', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response('Forbidden: bot was kicked from the supergroup chat'))
      .mockResolvedValue(response());
    vi.stubGlobal('fetch', fetchMock);
    const hook = renderHook(({ dialogs }) => useSyncGroups(12, 9, dialogs), {
      initialProps: { dialogs: [group] }, wrapper: createWrapper(),
    });
    await waitFor(() => expect(hook.result.current.statuses[group.userId]).toBe('kicked'));
    hook.rerender({ dialogs: [{ ...group }] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(group.firstName).toBe('Наш чат');
    await act(async () => { await hook.result.current.checkAccess(group.userId); });
    expect(hook.result.current.statuses[group.userId]).toBe('available');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('разделяет состояния разных ботов и проектов', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(response('Forbidden: bot was kicked from the supergroup chat'))
      .mockResolvedValue(response()));
    const hook = renderHook(({ project, token }) => useSyncGroups(project, token, [group]), {
      initialProps: { project: 12, token: 9 }, wrapper: createWrapper(),
    });
    await waitFor(() => expect(hook.result.current.statuses[group.userId]).toBe('kicked'));
    hook.rerender({ project: 12, token: 10 });
    await waitFor(() => expect(hook.result.current.statuses[group.userId]).toBe('available'));
    hook.rerender({ project: 13, token: 9 });
    await waitFor(() => expect(hook.result.current.statuses[group.userId]).toBe('available'));
    hook.rerender({ project: 12, token: 9 });
    expect(hook.result.current.statuses[group.userId]).toBe('kicked');
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('не запускает вторую проверку, пока первая не завершилась', async () => {
    let finish!: (value: ReturnType<typeof response>) => void;
    const pending = new Promise<ReturnType<typeof response>>((resolve) => { finish = resolve; });
    const fetchMock = vi.fn().mockReturnValue(pending);
    vi.stubGlobal('fetch', fetchMock);
    const hook = renderHook(() => useSyncGroups(12, 9, [group]), { wrapper: createWrapper() });
    expect(hook.result.current.statuses[group.userId]).toBe('checking');
    await act(async () => { await hook.result.current.checkAccess(group.userId); });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => { finish(response()); await pending; });
    await waitFor(() => expect(hook.result.current.statuses[group.userId]).toBe('available'));
  });

  it('показывает метку, блокирует проверку в полёте и скрывает строку при успехе', () => {
    const view = render(<GroupAccessStatus status="kicked" onCheck={vi.fn()} />);
    expect(screen.getByText('Бот исключён')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Проверить доступ' })).toBeEnabled();
    view.rerender(<GroupAccessStatus status="checking" onCheck={vi.fn()} />);
    expect(screen.getByRole('button')).toBeDisabled();
    view.rerender(<GroupAccessStatus status="available" onCheck={vi.fn()} />);
    expect(view.container).toBeEmptyDOMElement();
  });
});
