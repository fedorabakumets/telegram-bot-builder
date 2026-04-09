/**
 * @fileoverview Контекст для управления активными терминалами ботов
 *
 * Поддерживает два типа вкладок: live (живой бот) и history (история запуска).
 *
 * @module bot/ActiveTerminalsContext
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/** Тип вкладки терминала */
export type TerminalTabType = 'live' | 'history';

/**
 * Информация о вкладке терминала
 */
export interface TerminalInfo {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор токена */
  tokenId: number;
  /** Название бота */
  botName: string;
  /** Статус бота */
  isRunning: boolean;
  /** Тип вкладки: live — живой бот, history — история запуска */
  tabType?: TerminalTabType;
  /** ID запуска (только для tabType === 'history') */
  launchId?: number;
  /** Дата запуска для отображения в заголовке вкладки */
  launchStartedAt?: string | null;
}

/** Параметры для открытия вкладки истории */
interface OpenHistoryTabParams {
  /** ID проекта */
  projectId: number;
  /** ID токена */
  tokenId: number;
  /** Имя бота */
  botName: string;
  /** ID запуска */
  launchId: number;
  /** Дата запуска */
  launchStartedAt: string | null;
}

/**
 * Интерфейс контекста активных терминалов
 */
interface ActiveTerminalsContextType {
  /** Список активных терминалов */
  terminals: TerminalInfo[];
  /** Идентификатор активной вкладки */
  activeTerminalId: string | null;
  /** Добавить терминал в список */
  addTerminal: (info: TerminalInfo) => void;
  /** Удалить терминал из списка */
  removeTerminal: (projectId: number, tokenId: number) => void;
  /** Удалить вкладку по строковому ключу */
  removeTerminalById: (id: string) => void;
  /** Обновить статус терминала */
  updateTerminalStatus: (projectId: number, tokenId: number, isRunning: boolean) => void;
  /** Установить активный терминал по projectId и tokenId */
  setActiveTerminal: (projectId: number, tokenId: number) => void;
  /** Установить активный терминал по строковому ключу */
  setActiveTerminalById: (id: string) => void;
  /** Открыть вкладку с историей запуска */
  openHistoryTab: (params: OpenHistoryTabParams) => void;
  /** Получить масштаб для конкретной вкладки по её tabId */
  getTabScale: (tabId: string) => number;
  /** Изменить масштаб конкретной вкладки */
  adjustTabScale: (tabId: string, factor: number) => void;
  /** @deprecated Используй getTabScale/adjustTabScale. Оставлен для совместимости */
  terminalScale: number;
  /** @deprecated Используй getTabScale/adjustTabScale. Оставлен для совместимости */
  adjustTerminalScale: (factor: number) => void;
}

const ActiveTerminalsContext = createContext<ActiveTerminalsContextType | null>(null);

/**
 * Провайдер контекста активных терминалов
 * @param props - Свойства провайдера
 * @returns JSX элемент
 */
export function ActiveTerminalsProvider({ children }: { children: ReactNode }) {
  const [terminals, setTerminals] = useState<TerminalInfo[]>([]);
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null);
  /** Масштаб по вкладкам: tabId → scale */
  const [tabScales, setTabScales] = useState<Record<string, number>>({});

  const getTabScale = useCallback((tabId: string) => tabScales[tabId] ?? 1, [tabScales]);

  const adjustTabScale = useCallback((tabId: string, factor: number) => {
    setTabScales(prev => ({
      ...prev,
      [tabId]: Math.max(0.5, Math.min(2, (prev[tabId] ?? 1) * factor)),
    }));
  }, []);

  // Совместимость со старым API — работает с активной вкладкой
  const terminalScale = activeTerminalId ? (tabScales[activeTerminalId] ?? 1) : 1;
  const adjustTerminalScale = useCallback((factor: number) => {
    if (activeTerminalId) adjustTabScale(activeTerminalId, factor);
  }, [activeTerminalId, adjustTabScale]);

  const addTerminal = useCallback((info: TerminalInfo) => {
    setTerminals(prev => {
      const exists = prev.some(t => t.projectId === info.projectId && t.tokenId === info.tokenId);
      if (exists) return prev;
      return [...prev, info];
    });
    setActiveTerminalId(`${info.projectId}_${info.tokenId}`);
  }, []);

  const removeTerminal = useCallback((projectId: number, tokenId: number) => {
    setTerminals(prev => prev.filter(t => !(t.projectId === projectId && t.tokenId === tokenId)));
  }, []);

  const removeTerminalById = useCallback((id: string) => {
    setTerminals(prev => {
      const idx = prev.findIndex(t => {
        const key = t.tabType === 'history' ? `history_${t.launchId}` : `${t.projectId}_${t.tokenId}`;
        return key === id;
      });
      if (idx === -1) return prev;
      const next = prev.filter((_, i) => i !== idx);
      // Переключаемся на соседнюю вкладку если закрываем активную
      setActiveTerminalId(current => {
        if (current !== id) return current;
        if (next.length === 0) return null;
        const neighbour = next[idx] ?? next[idx - 1];
        return neighbour.tabType === 'history'
          ? `history_${neighbour.launchId}`
          : `${neighbour.projectId}_${neighbour.tokenId}`;
      });
      return next;
    });
  }, []);

  const updateTerminalStatus = useCallback((projectId: number, tokenId: number, isRunning: boolean) => {
    setTerminals(prev => prev.map(t =>
      (t.projectId === projectId && t.tokenId === tokenId) ? { ...t, isRunning } : t
    ));
  }, []);

  const setActiveTerminal = useCallback((projectId: number, tokenId: number) => {
    setActiveTerminalId(`${projectId}_${tokenId}`);
  }, []);

  const setActiveTerminalById = useCallback((id: string) => {
    setActiveTerminalId(id);
  }, []);

  const openHistoryTab = useCallback((params: OpenHistoryTabParams) => {
    const { projectId, tokenId, botName, launchId, launchStartedAt } = params;
    const tabId = `history_${launchId}`;
    setTerminals(prev => {
      const exists = prev.some(t => t.tabType === 'history' && t.launchId === launchId);
      if (exists) return prev;
      return [...prev, { projectId, tokenId, botName, isRunning: false, tabType: 'history', launchId, launchStartedAt }];
    });
    setActiveTerminalId(tabId);
  }, []);

  return (
    <ActiveTerminalsContext.Provider value={{
      terminals, activeTerminalId,
      addTerminal, removeTerminal, removeTerminalById,
      updateTerminalStatus, setActiveTerminal, setActiveTerminalById, openHistoryTab,
      getTabScale, adjustTabScale,
      terminalScale, adjustTerminalScale,
    }}>
      {children}
    </ActiveTerminalsContext.Provider>
  );
}

/**
 * Хук для доступа к контексту активных терминалов
 * @returns Контекст активных терминалов
 */
export function useActiveTerminals() {
  const context = useContext(ActiveTerminalsContext);
  if (!context) {
    throw new Error('useActiveTerminals должен использоваться внутри ActiveTerminalsProvider');
  }
  return context;
}
