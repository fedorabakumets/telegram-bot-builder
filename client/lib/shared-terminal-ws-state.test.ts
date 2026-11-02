/** @fileoverview Проверки подтверждения аналитического канала для поздних подписчиков и после обрыва. */
import { afterEach, expect, it, vi } from 'vitest';
import { getSharedAnalyticsBridgeState, setSharedAnalyticsBridgeState, setSharedTerminalWsState, subscribeSharedTerminalWsState } from './shared-terminal-ws-state';
afterEach(() => setSharedTerminalWsState('disconnected'));
it('сохраняет серверный статус для вкладки, открытой после установления соединения', () => {
  setSharedTerminalWsState('connected');
  expect(getSharedAnalyticsBridgeState()).toBeNull();
  setSharedAnalyticsBridgeState(true);
  const lateSubscriber = vi.fn();
  const unsubscribe = subscribeSharedTerminalWsState(lateSubscriber);
  expect(getSharedAnalyticsBridgeState()).toBe(true);
  setSharedAnalyticsBridgeState(false);
  expect(lateSubscriber).toHaveBeenCalledTimes(1);
  expect(getSharedAnalyticsBridgeState()).toBe(false);
  unsubscribe();
});
it('не переносит старое подтверждение на восстановленное соединение', () => {
  setSharedTerminalWsState('connected'); setSharedAnalyticsBridgeState(true);
  setSharedTerminalWsState('disconnected');
  expect(getSharedAnalyticsBridgeState()).toBeNull();
  setSharedAnalyticsBridgeState(true);
  expect(getSharedAnalyticsBridgeState()).toBeNull();
  setSharedTerminalWsState('connecting'); setSharedTerminalWsState('connected');
  expect(getSharedAnalyticsBridgeState()).toBeNull();
  setSharedAnalyticsBridgeState(true);
  expect(getSharedAnalyticsBridgeState()).toBe(true);
  setSharedTerminalWsState('connecting');
  expect(getSharedAnalyticsBridgeState()).toBeNull();
});
