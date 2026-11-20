/** @fileoverview Реальный useCanvasSync сохраняет dirty-черновик и исходную CAS-ревизию при агентском обновлении. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { useCanvasSync } from '../../client/hooks/use-canvas-sync';
import { updateProjectInDb } from './project-db';

/** Изолированный канал без доступа к сети или другим окнам. */
class Channel {
  /** Созданные каналы теста. */
  static instances: Channel[] = [];
  /** Обработчик входящего сообщения. */
  onmessage?: (event: { data: unknown }) => void;
  /** Запись локальной отправки. */
  postMessage = vi.fn();
  /** Закрывает тестовый канал. */
  close() {}
  /** Регистрирует экземпляр для управляемого входящего события. */
  constructor() { Channel.instances.push(this); }
}
/** Сокет-заглушка, не открывающий соединение. */
class Socket {
  /** Сокеты, доступные для доставки запоздавших событий. */
  static instances: Socket[] = [];
  /** Константа состояния протокола. */
  static OPEN = 1;
  /** Открытое соединение без реальной сети. */
  readyState = Socket.OPEN;
  /** Обработчик закрытия для управляемой доставки события. */
  onclose?: () => void;
  /** Запись тестовых сообщений. */
  send = vi.fn();
  /** Закрывает тестовое соединение. */
  close() {}
  /** Регистрирует экземпляр без подключения к серверу. */
  constructor() { Socket.instances.push(this); }
}

afterEach(() => { cleanup(); vi.unstubAllGlobals(); Channel.instances = []; Socket.instances = []; });
describe('Черновик и внешнее сохранение', () => {
  it('не рассылает открытый или одинаковый снимок, но принимает подтверждение новой ревизии', () => {
    vi.stubGlobal('BroadcastChannel', Channel); vi.stubGlobal('WebSocket', Socket);
    const data = { sheets: [], version: 2 };
    const onUpdate = vi.fn();
    const onSync = vi.fn();
    renderHook(() => useCanvasSync({ projectId: 1, savedRevision: 5,
      botDataWithSheets: data, onRemoteUpdate: onUpdate, onRemoteSync: onSync }));
    const channel = Channel.instances[0];
    expect(channel.postMessage).not.toHaveBeenCalled();
    const incoming = { type: 'canvas-sync', projectId: 1, tabId: 'other-window', timestamp: 100, data };
    act(() => channel.onmessage?.({ data: incoming }));
    expect(onUpdate).not.toHaveBeenCalled();
    expect(onSync).not.toHaveBeenCalled();
    const confirmed = { ...incoming, revision: 6 };
    act(() => channel.onmessage?.({ data: confirmed }));
    expect(onUpdate).not.toHaveBeenCalled();
    expect(onSync).toHaveBeenCalledExactlyOnceWith(confirmed);
  });

  it('рассылает только изменившийся локальный черновик текущего проекта', () => {
    vi.stubGlobal('BroadcastChannel', Channel); vi.stubGlobal('WebSocket', Socket);
    const data = { sheets: [], activeSheetId: 'first', version: 2 };
    const initialProps = { projectId: 1, localDraftProjectId: undefined as number | undefined, botDataWithSheets: data };
    const onUpdate = vi.fn();
    const { rerender } = renderHook((props) => useCanvasSync({ ...props, debounceMs: 0,
      onRemoteUpdate: onUpdate }), { initialProps });
    rerender({ ...initialProps, localDraftProjectId: 1 });
    expect(Channel.instances[0].postMessage).not.toHaveBeenCalled();

    const changed = { ...data, activeSheetId: 'second' };
    rerender({ ...initialProps, localDraftProjectId: 1, botDataWithSheets: changed });
    rerender({ ...initialProps, localDraftProjectId: 1, botDataWithSheets: { ...changed } });
    expect(Channel.instances[0].postMessage).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ projectId: 1, data: changed }));

    rerender({ projectId: 2, localDraftProjectId: 1, botDataWithSheets: changed });
    expect(Channel.instances[1].postMessage).not.toHaveBeenCalled();
    act(() => Socket.instances[0].onclose?.());
    const nextDraft = { ...data, activeSheetId: 'third' };
    rerender({ projectId: 2, localDraftProjectId: 2, botDataWithSheets: nextDraft });
    expect(Channel.instances[1].postMessage).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ projectId: 2, data: nextDraft }));
    expect(Socket.instances[1].send).toHaveBeenCalledOnce();
  });

  it('откладывает revision6, сохраняет draft/base5 и получает CAS409 вместо перезаписи', async () => {
    vi.stubGlobal('BroadcastChannel', Channel); vi.stubGlobal('WebSocket', Socket);
    vi.stubGlobal('requestAnimationFrame', (callback: () => void) => { callback(); return 1; });
    const local = { sheets: [], activeSheetId: 'local' };
    const remote = { sheets: [], activeSheetId: 'remote' };
    const onUpdate = vi.fn(); const onSync = vi.fn(); const onConflict = vi.fn(); const onReset = vi.fn();
    const hook = renderHook(({ dirty }) => useCanvasSync({ projectId: 1, savedRevision: 5,
      hasLocalChanges: dirty, botDataWithSheets: local as never,
      onRemoteUpdate: onUpdate, onRemoteSync: onSync, onRemoteConflict: onConflict,
      onRemoteReset: onReset }), { initialProps: { dirty: true } });
    act(() => Channel.instances[0].onmessage?.({ data: { type: 'canvas-sync', projectId: 1,
      tabId: 'other-window', timestamp: 99, data: remote } }));
    expect(onConflict).not.toHaveBeenCalled();
    act(() => Channel.instances[0].onmessage?.({ data: { type: 'canvas-sync', projectId: 1, tabId: 'agent', timestamp: 100,
      revision: 6, actor: { kind: 'agent', sessionId: 'test', displayName: 'Агент' }, data: remote } }));
    expect(onUpdate).not.toHaveBeenCalled(); expect(onSync).not.toHaveBeenCalled(); expect(onConflict).toHaveBeenCalledOnce();
    for (const kind of ['saved', 'reset']) {
      act(() => Channel.instances[0].onmessage?.({ data: { type: 'canvas-reset', projectId: 1,
        tabId: 'other-window', timestamp: 101, kind } }));
    }
    expect(onReset).not.toHaveBeenCalled();
    expect(onUpdate).not.toHaveBeenCalled(); expect(onSync).not.toHaveBeenCalled();
    const fetch = vi.fn(async (_url: unknown, init?: RequestInit) => {
      expect(JSON.parse(String(init?.body)).expectedRevision).toBe(5);
      return new Response(JSON.stringify({ message: 'Проект изменился' }), { status: 409 });
    });
    vi.stubGlobal('fetch', fetch);
    const saved = await updateProjectInDb(1, local, { expectedRevision: 5, skipValidation: true });
    expect(saved).toMatchObject({ status: 409 }); expect(fetch).toHaveBeenCalledOnce();
    expect(onUpdate).not.toHaveBeenCalled();
    act(() => hook.rerender({ dirty: false }));
    expect(onUpdate).toHaveBeenCalledWith(remote); expect(onSync).toHaveBeenCalledOnce();
  });
});
