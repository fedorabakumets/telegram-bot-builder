/**
 * @fileoverview Переход из списка файлов в просмотр кода на узком экране.
 */
import { createContext, useContext, type ReactNode } from 'react';

/** Общая навигация и место заголовка мобильной вкладки кода. */
interface CodeViewNavigation {
  /** Обработчик перехода к редактору. */
  openCodeView: (() => void) | null;
  /** Контейнер общей шапки. */
  headerTarget: HTMLDivElement | null;
  /** Переключатель списка файлов и просмотра кода на узком экране. */
  viewControls?: ReactNode;
}

/** Контекст мобильной вкладки кода. */
export const CodeViewNavigationContext = createContext<CodeViewNavigation | null>(null);

/**
 * Возвращает переход к коду или отсутствие перехода при отображении панелей рядом.
 * @returns Обработчик открытия мобильного редактора либо null.
 */
export function useOpenCodeView() {
  return useContext(CodeViewNavigationContext)?.openCodeView ?? null;
}

/**
 * Возвращает контейнер и дополнительные действия общей шапки кода.
 * @returns Данные внешней шапки либо null для обычной панели.
 */
export function useCodeHeader() {
  return useContext(CodeViewNavigationContext);
}
