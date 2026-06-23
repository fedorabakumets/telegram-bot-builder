/**
 * @fileoverview Общее WebSocket-соединение к /api/terminal?projectId=0&tokenId=0
 * @module client/lib/shared-terminal-ws
 */

/** Обработчик входящего сообщения Terminal WS */
type TerminalMessageListener = (data: unknown) => void;

/** Активное соединение */
let ws: WebSocket | null = null;
/** Число активных подписчиков */
let subscriberCount = 0;
/** Таймер переподключения */
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
/** Таймер ping для удержания соединения */
let pingTimer: ReturnType<typeof setInterval> | null = null;
/** Подписчики на сообщения */
const listeners = new Set<TerminalMessageListener>();
/** Подписчики на переподключение (не первое открытие) */
const reconnectListeners = new Set<() => void>();
/** Было ли уже хотя бы одно успешное подключение */
let hasConnectedOnce = false;

/**
 * Открывает WebSocket если ещё не подключён
 */
function ensureConnected(): void {
  if (typeof window === 'undefined') return;
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = `${protocol}//${window.location.host}/api/terminal?projectId=0&tokenId=0`;
  ws = new WebSocket(url);

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data as string);
      listeners.forEach((listener) => listener(msg));
    } catch {
      // Игнорируем некорректные сообщения
    }
  };

  ws.onopen = () => {
    if (hasConnectedOnce) {
      reconnectListeners.forEach((listener) => listener());
    }
    hasConnectedOnce = true;
    if (pingTimer) clearInterval(pingTimer);
    pingTimer = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ command: 'ping' }));
      }
    }, 20_000);
  };

  ws.onclose = () => {
    ws = null;
    if (pingTimer) {
      clearInterval(pingTimer);
      pingTimer = null;
    }
    if (subscriberCount > 0) {
      reconnectTimer = setTimeout(ensureConnected, 3000);
    }
  };

  ws.onerror = () => ws?.close();
}

/**
 * Закрывает соединение если подписчиков не осталось
 */
function maybeDisconnect(): void {
  if (subscriberCount > 0) return;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (pingTimer) {
    clearInterval(pingTimer);
    pingTimer = null;
  }
  ws?.close();
  ws = null;
}

/**
 * Подписывается на сообщения общего Terminal WebSocket
 * @param listener - Обработчик входящих сообщений
 * @returns Функция отписки
 */
export function subscribeSharedTerminalWs(listener: TerminalMessageListener): () => void {
  listeners.add(listener);
  subscriberCount += 1;
  ensureConnected();
  return () => {
    listeners.delete(listener);
    subscriberCount -= 1;
    maybeDisconnect();
  };
}

/**
 * Подписывается на переподключение общего Terminal WebSocket
 * @param listener - Обработчик переподключения
 * @returns Функция отписки
 */
export function onSharedTerminalWsReconnect(listener: () => void): () => void {
  reconnectListeners.add(listener);
  return () => reconnectListeners.delete(listener);
}
