/** @fileoverview Проверки позднего подтверждения аналитики и изоляции событий закрытого общего сокета. */
import { afterEach, expect, it, vi } from 'vitest';
/** Управляемое соединение без сети и реальных серверных событий. */
class TestSocket {
  /** Состояние открытого соединения. */ static OPEN = 1;
  /** Состояние соединяющегося сокета. */ static CONNECTING = 0;
  /** Созданные соединения теста. */ static instances: TestSocket[] = [];
  /** Текущее состояние. */ readyState = 0;
  /** Обработчик открытия. */ onopen: (() => void) | null = null;
  /** Обработчик закрытия. */ onclose: (() => void) | null = null;
  /** Обработчик ошибки. */ onerror: ((event: unknown) => void) | null = null;
  /** Обработчик сообщения. */ onmessage: ((event: { /** Сериализованный пакет. */ data: string }) => void) | null = null;
  /** Запоминает созданное соединение. */ constructor() { TestSocket.instances.push(this); }
  /** Переводит соединение в состояние ожидания закрытия. */ close() { this.readyState = 2; }
  /** Фиксирует служебную отправку. */ send = vi.fn();
  /** Открывает соединение с вызовом подписчиков. */ open() { this.readyState = 1; this.onopen?.(); }
  /** Доставляет подтверждение канала аналитики. */ status(connected: boolean) { this.onmessage?.({ data: JSON.stringify({ type: 'analytics-status', projectId: 0, data: { connected } }) }); }
}
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); TestSocket.instances = []; });
it('не переносит поздние события старого сокета на новое соединение и его статус', async () => {
  vi.useFakeTimers(); vi.resetModules(); vi.stubGlobal('WebSocket', TestSocket);
  const shared = await import('./shared-terminal-ws');
  const offFirst = shared.subscribeSharedTerminalWs(() => {});
  const first = TestSocket.instances[0];
  first.open(); first.status(true);
  expect(shared.getSharedAnalyticsBridgeState()).toBe(true);
  const offLate = shared.subscribeSharedTerminalWs(() => {});
  expect(shared.getSharedAnalyticsBridgeState()).toBe(true);
  offFirst(); offLate();
  await vi.advanceTimersByTimeAsync(401);
  expect(shared.getSharedAnalyticsBridgeState()).toBeNull();
  const offNext = shared.subscribeSharedTerminalWs(() => {});
  const next = TestSocket.instances[1];
  next.open(); next.status(true);
  first.onclose?.(); first.status(false);
  expect(shared.getSharedTerminalWsState()).toBe('connected');
  expect(shared.getSharedAnalyticsBridgeState()).toBe(true);
  next.onclose?.();
  expect(shared.getSharedAnalyticsBridgeState()).toBeNull();
  offNext(); await vi.advanceTimersByTimeAsync(401);
});
