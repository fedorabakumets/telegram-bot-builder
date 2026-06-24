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
/** Таймер отложенного закрытия при падении числа подписчиков до 0 */
let disconnectTimer: ReturnType<typeof setTimeout> | null = null;
/** Задержка перед закрытием сокета без подписчиков (мс), гасит быстрый churn 1↔0 */
const DISCONNECT_DELAY_MS = 400;
/** Подписчики на сообщения */
const listeners = new Set<TerminalMessageListener>();
/** Подписчики на переподключение (не первое открытие) */
const reconnectListeners = new Set<() => void>();
/** Было ли уже хотя бы одно успешное подключение */
let hasConnectedOnce = false;

/** Префикс логов ошибок общего Terminal WS */
const LOG_PREFIX = '[SharedTerminalWS]';

/**
 * Открывает WebSocket если ещё не подключён
 */
function ensureConnected(): void {
  if (typeof window === 'undefined') return;
  // Появился интерес к соединению — отменяем отложенное закрытие
  if (disconnectTimer) {
    clearTimeout(disconnectTimer);
    disconnectTimer = null;
  }
  // Сбрасываем таймер переподключения: соединение либо уже есть, либо создаётся сейчас
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
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
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(ensureConnected, 3000);
    }
  };

  ws.onerror = (event) => {
    console.error(`${LOG_PREFIX} Ошибка WebSocket-соединения:`, event);
    ws?.close();
  };
}

/**
 * Немедленно закрывает соединение и сбрасывает все таймеры.
 * Вызывается только когда подтверждено, что подписчиков нет.
 */
function closeConnectionNow(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (pingTimer) {
    clearInterval(pingTimer);
    pingTimer = null;
  }
  const closing = ws;
  ws = null;
  closing?.close();
}

/**
 * Планирует отложенное закрытие соединения при отсутствии подписчиков.
 * Закрытие откладывается на DISCONNECT_DELAY_MS, чтобы быстрый churn подписчиков
 * (1↔0 при открытии/закрытии диалогов, React StrictMode в dev) не пересоздавал сокет.
 * Если за время задержки появится новый подписчик — ensureConnected отменит таймер.
 */
function maybeDisconnect(): void {
  if (subscriberCount > 0) return;
  if (disconnectTimer) return;
  disconnectTimer = setTimeout(() => {
    disconnectTimer = null;
    // Повторная проверка: за время задержки мог появиться подписчик
    if (subscriberCount > 0) return;
    closeConnectionNow();
  }, DISCONNECT_DELAY_MS);
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
