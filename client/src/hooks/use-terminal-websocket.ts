/**
 * @fileoverview Хук для управления WebSocket-соединением с терминалом
 *
 * Этот хук предоставляет функциональность для подключения к WebSocket-серверу терминала,
 * получения сообщений и управления состоянием соединения.
 *
 * @module useTerminalWebSocket
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { TerminalHandle } from '../components/editor/Terminal'; // Импортируем тип из компонента Terminal

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
export const useTerminalWebSocket = ({ terminalRef, projectId, tokenId }: UseTerminalWebSocketParams): UseTerminalWebSocketResult => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);

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
      console.log(`Подключение к WebSocket: ${wsUrl}`);
      setStatus('connecting');

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Соединение с терминалом установлено');
        setStatus('connected');

        // Отправляем сообщение в терминал о подключении
        if (terminalRefRef.current?.current) {
          terminalRefRef.current.current.addLineLocal(`[Система] Подключено к терминалу бота (ID проекта: ${projectIdRef.current}, ID токена: ${tokenIdRef.current})`, 'stdout');
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: TerminalWebSocketMessage = JSON.parse(event.data);

          // Отправляем сообщение в терминал без отправки обратно на сервер
          if (terminalRefRef.current?.current) {
            // Для типа 'status' используем 'stdout', так как TerminalHandle.addLine принимает только 'stdout' или 'stderr'
            const outputType = message.type === 'status' ? 'stdout' : message.type;
            terminalRefRef.current.current.addLineLocal(`[PID:${message.projectId}/${message.tokenId}] ${message.content}`, outputType);
          }
        } catch (error) {
          console.error('Ошибка при обработке сообщения от терминала:', error);
          if (terminalRefRef.current?.current) {
            terminalRefRef.current.current.addLineLocal(`[Ошибка] Некорректное сообщение от сервера: ${event.data}`, 'stderr');
          }
        }
      };

      ws.onclose = (event) => {
        console.log(`Соединение с терминалом закрыто: код ${event.code}, причина: ${event.reason}`);
        setStatus('disconnected');

        // НЕ пытаемся переподключиться автоматически
        // Переподключение будет инициировано через useEffect в BotTerminal
        // при изменении статуса на 'disconnected'
      };

      ws.onerror = (error) => {
        console.error('Ошибка WebSocket-соединения с терминалом:', error);
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
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setStatus('disconnected');

    if (terminalRef?.current) {
      terminalRef.current.addLineLocal('[Система] Отключено от терминала', 'stdout');
    }
  };

  // Автоматически подключаемся при изменении projectId или tokenId
  // А также при монтировании если projectId и tokenId доступны
  useEffect(() => {
    if (projectId && tokenId) {
      // Если соединение ещё не установлено или закрыто - подключаемся
      if (status === 'disconnected') {
        console.log('Автоматическое подключение к терминалу, projectId:', projectId, 'tokenId:', tokenId);
        connect();
      }
    }

    // При размонтировании компонента НЕ закрываем соединение
    // Оно будет закрыто только при остановке бота или явном вызове disconnect
    return () => {
      // Сохраняем соединение при размонтировании
      // Переподключение произойдёт автоматически при монтировании если нужно
    };
  }, [projectId, tokenId]); // Убрали status из зависимостей чтобы избежать цикла

  return {
    status,
    wsConnection: wsRef.current,
    connect,
    disconnect
  };
};