/**
 * @fileoverview Хук для методов терминала
 *
 * Предоставляет методы для управления терминалом:
 * - Добавление строк
 * - Отправка на сервер
 * - Очистка
 *
 * @module useTerminalMethods
 */

import { useBotLogs } from '@/components/editor/bot/contexts/bot-logs-context';
import { TerminalLine, TerminalHandle } from './terminalTypes';

/** Счётчик для генерации уникальных id строк терминала */
let lineIdCounter = 0;

/**
 * Генерирует уникальный id для строки терминала
 * @returns Уникальная строка id
 */
function generateLineId(): string {
  return `${Date.now()}-${++lineIdCounter}`;
}

interface UseTerminalMethodsParams {
  logKey: string | null;
  wsConnection?: WebSocket | null;
  projectId?: number;
  tokenId?: number;
  setLines: (lines: TerminalLine[] | ((prev: TerminalLine[]) => TerminalLine[])) => void;
}

/**
 * Хук для методов терминала
 * @param params - Параметры хука
 * @returns Объект с методами терминала
 */
export function useTerminalMethods({
  logKey,
  wsConnection,
  projectId,
  tokenId,
  setLines
}: UseTerminalMethodsParams): TerminalHandle & { clearTerminal: () => void } {
  const { addLog, clearLogs } = useBotLogs();

  /**
   * Отправить строку на сервер
   */
  const sendToServer = (content: string, type: 'stdout' | 'stderr' = 'stdout') => {
    if (wsConnection && projectId !== undefined && tokenId !== undefined) {
      const message = {
        type,
        content,
        projectId,
        tokenId,
        timestamp: new Date().toISOString()
      };

      if (wsConnection.readyState === WebSocket.OPEN) {
        wsConnection.send(JSON.stringify(message));
      } else {
        console.warn('WebSocket-соединение недоступно для отправки лога:', content);
      }
    } else {
      console.warn('Недостаточно данных для отправки лога на сервер:', content);
    }
  };

  /**
   * Добавить новую строку в терминал
   */
  const addLine = (content: string, type: 'stdout' | 'stderr' = 'stdout', sendToServerFlag: boolean = true) => {
    const newLine: TerminalLine = {
      id: generateLineId(),
      content,
      type,
      timestamp: new Date()
    };

    if (logKey) {
      addLog(logKey, newLine);
    }

    if (sendToServerFlag) {
      sendToServer(content, type);
    }
  };

  /**
   * Добавить строку без отправки на сервер
   */
  const addLineLocal = (content: string, type: 'stdout' | 'stderr' = 'stdout', timestamp?: Date, logId?: number) => {
    const newLine: TerminalLine = {
      id: logId != null ? String(logId) : generateLineId(),
      content,
      type,
      timestamp: timestamp ?? new Date()
    };

    if (logKey) {
      addLog(logKey, newLine);
    }
  };

  /**
   * Очистить терминал (клиент + сервер)
   */
  const clearTerminal = () => {
    setLines([]);
    if (logKey) {
      clearLogs(logKey);
    }
    // Удаляем логи из БД на сервере
    if (projectId && tokenId) {
      fetch(`/api/projects/${projectId}/tokens/${tokenId}/logs`, { method: 'DELETE' })
        .catch(err => console.error('Ошибка очистки логов на сервере:', err));
    }
  };

  return {
    addLine,
    addLineLocal,
    sendToServer,
    clearTerminal
  };
}
