/**
 * @fileoverview Контекст для глобального хранения логов ботов
 *
 * Этот модуль предоставляет контекст и хук для доступа к логам ботов,
 * которые сохраняются при переключении между вкладками приложения.
 *
 * @module BotLogsContext
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/**
 * Тип для одной строки лога
 */
interface LogEntry {
  id: string;
  content: string;
  type: 'stdout' | 'stderr';
  timestamp: Date;
}

/**
 * Тип для хранилища логов по ключу проекта/токена
 */
interface BotLogsStore {
  logs: Record<string, LogEntry[]>;
  addLog: (key: string, entry: LogEntry) => void;
  getLogs: (key: string) => LogEntry[];
  clearLogs: (key: string) => void;
}

const BotLogsContext = createContext<BotLogsStore | null>(null);

/**
 * Провайдер контекста логов ботов
 */
export function BotLogsProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<Record<string, LogEntry[]>>({});

  const addLog = useCallback((key: string, entry: LogEntry) => {
    setLogs(prev => {
      const currentLogs = prev[key] || [];
      const updatedLogs = [...currentLogs, entry].slice(-1000);
      return { ...prev, [key]: updatedLogs };
    });
  }, []);

  const getLogs = useCallback((key: string) => logs[key] || [], [logs]);

  const clearLogs = useCallback((key: string) => {
    setLogs(prev => ({ ...prev, [key]: [] }));
  }, []);

  return (
    <BotLogsContext.Provider value={{ logs, addLog, getLogs, clearLogs }}>
      {children}
    </BotLogsContext.Provider>
  );
}

/**
 * Хук для доступа к контексту логов ботов
 */
export function useBotLogs() {
  const context = useContext(BotLogsContext);
  if (!context) {
    throw new Error('useBotLogs должен использоваться внутри BotLogsProvider');
  }
  return context;
}
