/**
 * @fileoverview Контекст для управления активными терминалами ботов
 *
 * Этот модуль предоставляет контекст и хук для управления
 * активными терминалами и переключения между ними.
 *
 * @module bot/ActiveTerminalsContext
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/**
 * Информация о терминале бота
 */
interface TerminalInfo {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор токена */
  tokenId: number;
  /** Название бота */
  botName: string;
  /** Статус бота */
  isRunning: boolean;
}

/**
 * Интерфейс контекста активных терминалов
 */
interface ActiveTerminalsContextType {
  /** Список активных терминалов */
  terminals: TerminalInfo[];
  /** Идентификатор активного терминала (ключ projectId_tokenId) */
  activeTerminalId: string | null;
  /** Добавить терминал в список */
  addTerminal: (info: TerminalInfo) => void;
  /** Удалить терминал из списка */
  removeTerminal: (projectId: number, tokenId: number) => void;
  /** Обновить статус терминала */
  updateTerminalStatus: (projectId: number, tokenId: number, isRunning: boolean) => void;
  /** Установить активный терминал */
  setActiveTerminal: (projectId: number, tokenId: number) => void;
}

const ActiveTerminalsContext = createContext<ActiveTerminalsContextType | null>(null);

/**
 * Провайдер контекста активных терминалов
 */
export function ActiveTerminalsProvider({ children }: { children: ReactNode }) {
  const [terminals, setTerminals] = useState<TerminalInfo[]>([]);
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null);

  const addTerminal = useCallback((info: TerminalInfo) => {
    console.log('[ActiveTerminals] addTerminal:', info);
    setTerminals(prev => {
      const exists = prev.some(t => t.projectId === info.projectId && t.tokenId === info.tokenId);
      console.log('[ActiveTerminals] terminal exists:', exists);
      if (exists) return prev;
      const newState = [...prev, info];
      console.log('[ActiveTerminals] new terminals:', newState);
      return newState;
    });
    // Автоматически переключаемся на новый терминал
    setActiveTerminalId(`${info.projectId}_${info.tokenId}`);
    console.log('[ActiveTerminals] activeTerminalId:', `${info.projectId}_${info.tokenId}`);
  }, []);

  const removeTerminal = useCallback((projectId: number, tokenId: number) => {
    setTerminals(prev => prev.filter(t => !(t.projectId === projectId && t.tokenId === tokenId)));
  }, []);

  const updateTerminalStatus = useCallback((projectId: number, tokenId: number, isRunning: boolean) => {
    setTerminals(prev => prev.map(t =>
      (t.projectId === projectId && t.tokenId === tokenId) ? { ...t, isRunning } : t
    ));
  }, []);

  const setActiveTerminal = useCallback((projectId: number, tokenId: number) => {
    setActiveTerminalId(`${projectId}_${tokenId}`);
  }, []);

  return (
    <ActiveTerminalsContext.Provider value={{ terminals, activeTerminalId, addTerminal, removeTerminal, updateTerminalStatus, setActiveTerminal }}>
      {children}
    </ActiveTerminalsContext.Provider>
  );
}

/**
 * Хук для доступа к контексту активных терминалов
 */
export function useActiveTerminals() {
  const context = useContext(ActiveTerminalsContext);
  if (!context) {
    throw new Error('useActiveTerminals должен использоваться внутри ActiveTerminalsProvider');
  }
  return context;
}
