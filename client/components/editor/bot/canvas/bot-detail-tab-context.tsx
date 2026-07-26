/**
 * @fileoverview Контекст вкладки detail-панели бота на холсте
 * @module bot/canvas/bot-detail-tab-context
 */

import { createContext, useContext, type ReactNode } from 'react';

/** Идентификатор вкладки detail-панели */
export type BotDetailTabId = 'history' | 'settings' | 'variables' | 'terminal';

/** API контекста вкладок */
interface BotDetailTabContextValue {
  /** Переключить вкладку detail-панели */
  setTab: (tab: BotDetailTabId) => void;
}

const BotDetailTabContext = createContext<BotDetailTabContextValue | null>(null);

/**
 * Провайдер вкладок detail-панели
 * @param props - children и setTab
 * @returns JSX
 */
export function BotDetailTabProvider({
  setTab,
  children,
}: {
  /** Сеттер вкладки */
  setTab: (tab: BotDetailTabId) => void;
  /** Дочерние элементы */
  children: ReactNode;
}) {
  return (
    <BotDetailTabContext.Provider value={{ setTab }}>
      {children}
    </BotDetailTabContext.Provider>
  );
}

/**
 * Опциональный доступ к setTab detail-панели (null вне холста)
 * @returns Контекст или null
 */
export function useBotDetailTabOptional(): BotDetailTabContextValue | null {
  return useContext(BotDetailTabContext);
}
