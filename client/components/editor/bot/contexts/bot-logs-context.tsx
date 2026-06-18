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
  /** Загрузить или слить логи из БД (по id без дублей) */
  hydrateLogs: (key: string, entries: LogEntry[]) => void;
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
      if (currentLogs.some(e => e.id === entry.id)) return prev;
      const last = currentLogs[currentLogs.length - 1];
      if (last && last.content === entry.content && last.type === entry.type &&
          Math.abs(last.timestamp.getTime() - entry.timestamp.getTime()) < 500) {
        return prev;
      }
      const updatedLogs = [...currentLogs, entry]
        .slice(-1000)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      return { ...prev, [key]: updatedLogs };
    });
  }, []);

  const hydrateLogs = useCallback((key: string, entries: LogEntry[]) => {
    if (entries.length === 0) return;
    setLogs(prev => {
      const byId = new Map<string, LogEntry>();
      for (const e of prev[key] || []) byId.set(e.id, e);
      for (const e of entries) byId.set(e.id, e);
      const merged = Array.from(byId.values())
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .slice(-1000);
      return { ...prev, [key]: merged };
    });
  }, []);

  const getLogs = useCallback((key: string) => logs[key] || [], [logs]);

  const clearLogs = useCallback((key: string) => {
    setLogs(prev => ({ ...prev, [key]: [] }));
  }, []);

  return (
    <BotLogsContext.Provider value={{ logs, addLog, getLogs, hydrateLogs, clearLogs }}>
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
