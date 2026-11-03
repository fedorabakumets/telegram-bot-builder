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
  /** Константа состояния протокола. */
  static OPEN = 1;
  /** Незавершённое соединение не запускает keepalive. */
  readyState = 0;
  /** Игнорирует отправку тестового сообщения. */
  send() {}
  /** Закрывает тестовое соединение. */
  close() {}
}

afterEach(() => { cleanup(); vi.unstubAllGlobals(); Channel.instances = []; });
describe('Черновик и внешнее сохранение', () => {
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
