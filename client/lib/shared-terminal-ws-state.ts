/** @fileoverview Состояние общего живого соединения без отдельного WebSocket. */
/** Возможное состояние транспорта. */
export type SharedTerminalWsState = 'connecting' | 'connected' | 'disconnected';
/** Текущее состояние транспорта. */
let state: SharedTerminalWsState = 'disconnected';
/** Последнее подтверждённое состояние аналитического канала текущего соединения. */
let analyticsBridge: boolean | null = null;
/** Подписчики состояния. */
const listeners = new Set<() => void>();
/** Возвращает состояние для внешнего хранилища React. */
export function getSharedTerminalWsState(): SharedTerminalWsState { return state; }
/** Возвращает подтверждение канала; до серверного ответа состояние неизвестно. */
export function getSharedAnalyticsBridgeState(): boolean | null { return analyticsBridge; }
/** Подписывает интерфейс на изменения соединения. */
export function subscribeSharedTerminalWsState(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
/** Обновляет состояние, уведомляя только при его изменении. */
export function setSharedTerminalWsState(next: SharedTerminalWsState): void {
  const resetBridge = next !== 'connected' && analyticsBridge !== null;
  if (state === next && !resetBridge) return;
  state = next;
  if (resetBridge) analyticsBridge = null;
  listeners.forEach(listener => listener());
}
/** Сохраняет серверное подтверждение для позднее открытых вкладок. */
export function setSharedAnalyticsBridgeState(next: boolean): void {
  if (state !== 'connected' || analyticsBridge === next) return;
  analyticsBridge = next;
  listeners.forEach(listener => listener());
}
