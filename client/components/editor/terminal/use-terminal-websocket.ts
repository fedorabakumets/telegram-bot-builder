/**
 * @fileoverview Хук для управления WebSocket-соединением с терминалом
 *
 * Этот хук предоставляет функциональность для подключения к WebSocket-серверу терминала,
 * получения сообщений и управления состоянием соединения.
 *
 * @module useTerminalWebSocket
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { TerminalHandle } from './Terminal';

/**
 * Тип для сообщений, получаемых от WebSocket-сервера терминала
 * @typedef {Object} TerminalWebSocketMessage
 * @property {string} type - Тип сообщения ('stdout' | 'stderr' | 'status')
 * @property {string} content - Содержимое сообщения
 * @property {number} projectId - Идентификатор проекта
 * @property {number} tokenId - Идентификатор токена
 * @property {string} timestamp - Временная метка
 */
interface TerminalWebSocketMessage {
  type: 'stdout' | 'stderr' | 'status';
  content: string;
  projectId: number;
  tokenId: number;
  timestamp: string;
  /** ID записи в bot_logs */
  logId?: number;
}

/**
 * Тип для состояния соединения
 * @typedef {'disconnected' | 'connecting' | 'connected' | 'error'} ConnectionStatus
 */
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Параметры для хука
 * @typedef {Object} UseTerminalWebSocketParams
 * @property {React.RefObject<TerminalHandle> | null} terminalRef - Ссылка на компонент терминала
 * @property {number | null} projectId - Идентификатор проекта
 * @property {number | null} tokenId - Идентификатор токена
 */
interface UseTerminalWebSocketParams {
  terminalRef: React.RefObject<TerminalHandle> | null;
  projectId: number | null;
  tokenId: number | null;
}

/**
 * Тип возвращаемого значения хука
 * @typedef {Object} UseTerminalWebSocketResult
 * @property {ConnectionStatus} status - Состояние соединения
 * @property {WebSocket | null} wsConnection - WebSocket-соединение
 * @property {() => void} connect - Метод для подключения
 * @property {() => void} disconnect - Метод для отключения
 */
interface UseTerminalWebSocketResult {
  status: ConnectionStatus;
  wsConnection: WebSocket | null;
  connect: () => void;
  disconnect: () => void;
}

/**
 * Хук для управления WebSocket-соединением с терминалом
 *
 * @param {UseTerminalWebSocketParams} params - Параметры хука
 * @returns {UseTerminalWebSocketResult} Объект с состоянием соединения и методами управления
 */

/** Глобальный реестр активных WebSocket-соединений по ключу projectId_tokenId */
const activeConnections = new Map<string, { ws: WebSocket; refCount: number }>();

export const useTerminalWebSocket = ({ terminalRef, projectId, tokenId }: UseTerminalWebSocketParams): UseTerminalWebSocketResult => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  /** Ключ для реестра соединений */
  const connectionKeyRef = useRef<string | null>(null);

  // Используем ref для хранения актуальных значений чтобы избежать пересоздания connect
  const projectIdRef = useRef(projectId);
  const tokenIdRef = useRef(tokenId);
  const terminalRefRef = useRef(terminalRef);

  useEffect(() => {
    projectIdRef.current = projectId;
    tokenIdRef.current = tokenId;
    terminalRefRef.current = terminalRef;
  }, [projectId, tokenId, terminalRef]);

  /**
   * Подключается к WebSocket-серверу терминала
   */
  const connect = useCallback(() => {
    // Проверяем, что у нас есть все необходимые параметры
    if (!projectIdRef.current || !tokenIdRef.current) {
      console.error('Необходимы projectId и tokenId для подключения к терминалу');
      setStatus('error');
      return;
    }

    const key = `${projectIdRef.current}_${tokenIdRef.current}`;

    // Если уже есть активное соединение для этого бота — переиспользуем
    const existing = activeConnections.get(key);
    if (existing && existing.ws.readyState === WebSocket.OPEN) {
      existing.refCount++;
      connectionKeyRef.current = key;
      wsRef.current = existing.ws;
      setStatus('connected');
      return;
    }

    // Закрываем предыдущее соединение, если оно существует
    if (wsRef.current) {
      console.log('Закрываем старое WebSocket-соединение перед новым подключением');
      wsRef.current.close();
      wsRef.current = null;
    }

    // Формируем URL для подключения
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/terminal?projectId=${projectIdRef.current}&tokenId=${tokenIdRef.current}`;

    try {
      console.log(`[WS-Terminal] Подключение к WebSocket: ${wsUrl}`);
      console.log(`[WS-Terminal] projectId=${projectIdRef.current}, tokenId=${tokenIdRef.current}, key=${key}`);
      setStatus('connecting');

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      connectionKeyRef.current = key;

      // Регистрируем в глобальном реестре
      activeConnections.set(key, { ws, refCount: 1 });

      ws.onopen = () => {
        console.log('[WS-Terminal] ✅ Соединение с терминалом установлено');
        setStatus('connected');

        // Keepalive ping каждые 30 сек — Railway proxy закрывает idle WebSocket
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ command: 'ping' }));
          } else {
            clearInterval(pingInterval);
          }
        }, 30_000);
        (ws as any).__pingInterval = pingInterval;
      };

      ws.onmessage = (event) => {
        try {
          const message: TerminalWebSocketMessage = JSON.parse(event.data);

          // Игнорируем pong-ответы на keepalive ping
          if ((message as any).command === 'pong') return;

          // Отправляем сообщение в терминал без отправки обратно на сервер
          const hasRef = !!terminalRefRef.current?.current;
          if (!hasRef) {
            console.warn('[WS-Terminal] ⚠️ terminalRef.current недоступен, сообщение потеряно:', message.content?.slice(0, 80));
            return;
          }
          // Для типа 'status' используем 'stdout', так как TerminalHandle.addLine принимает только 'stdout' или 'stderr'
          const outputType = message.type === 'status' ? 'stdout' : message.type;
          // Защита от undefined content
          const content = message.content ?? '';
          if (content) {
            const ts = message.timestamp ? new Date(message.timestamp) : undefined;
            terminalRefRef.current.current!.addLineLocal(content, outputType, ts, message.logId);
          }
        } catch (error) {
          console.error('[WS-Terminal] Ошибка при обработке сообщения от терминала:', error);
          if (terminalRefRef.current?.current) {
            terminalRefRef.current.current.addLineLocal(`[Ошибка] Некорректное сообщение от сервера: ${event.data}`, 'stderr');
          }
        }
      };

      ws.onclose = (event) => {
        console.log(`[WS-Terminal] ❌ Соединение закрыто: код ${event.code}, причина: "${event.reason}", wasClean: ${event.wasClean}`);
        // Очищаем keepalive ping
        if ((ws as any).__pingInterval) {
          clearInterval((ws as any).__pingInterval);
        }
        setStatus('disconnected');
        // Удаляем из реестра при закрытии
        if (connectionKeyRef.current) {
          activeConnections.delete(connectionKeyRef.current);
        }
      };

      ws.onerror = (error) => {
        console.error('[WS-Terminal] ❌ Ошибка WebSocket:', error);
        console.error('[WS-Terminal] readyState при ошибке:', ws.readyState, '(0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED)');
        setStatus('error');

        if (terminalRefRef.current?.current) {
          terminalRefRef.current.current.addLineLocal('[Ошибка] Соединение с терминалом потеряно', 'stderr');
        }
      };
    } catch (error) {
      console.error('Ошибка при создании WebSocket-соединения:', error);
      setStatus('error');
    }
  }, []);

  /**
   * Отключается от WebSocket-сервера терминала
   */
  const disconnect = () => {
    const key = connectionKeyRef.current;
    if (key) {
      const entry = activeConnections.get(key);
      if (entry) {
        entry.refCount--;
        // Закрываем только если больше никто не использует
        if (entry.refCount <= 0) {
          entry.ws.close();
          activeConnections.delete(key);
        }
      }
      connectionKeyRef.current = null;
    }

    wsRef.current = null;
    setStatus('disconnected');

    if (terminalRef?.current) {
      terminalRef.current.addLineLocal('[Система] Отключено от терминала', 'stdout');
    }
  };

  // Автоматическое подключение НЕ выполняется
  // Подключение инициируется из компонента BotTerminal через useEffect

  return {
    status,
    wsConnection: wsRef.current,
    connect,
    disconnect
  };
};