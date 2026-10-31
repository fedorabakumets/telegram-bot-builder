/**
 * @fileoverview Переход из списка файлов в просмотр кода на узком экране.
 */
import { createContext, useContext } from 'react';

/** Общая навигация и место заголовка мобильной вкладки кода. */
interface CodeViewNavigation {
  /** Обработчик перехода к редактору. */
  openCodeView: () => void;
  /** Контейнер заголовка над переключателем режимов. */
  headerTarget: HTMLDivElement | null;
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
 * Возвращает контейнер общего заголовка мобильной вкладки.
 * @returns Контейнер над переключателем либо null для обычной панели.
 */
export function useCodeHeaderTarget() {
  return useContext(CodeViewNavigationContext)?.headerTarget ?? null;
}
