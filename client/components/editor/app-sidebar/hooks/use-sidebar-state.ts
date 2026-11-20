/**
 * @fileoverview Хук управления состоянием свёрнутости сайдбара
 */

import { useSyncExternalStore } from 'react';

const SIDEBAR_STATE_KEY = 'botcraft-sidebar-collapsed';
const SIDEBAR_STATE_EVENT = 'botcraft-sidebar-collapsed-change';
let collapsedFallback = true;

/** Читает общий снимок свёрнутости для профиля и уже открытых проектов. */
function readCollapsed(): boolean {
  try { return window.localStorage.getItem(SIDEBAR_STATE_KEY) !== 'false'; } catch { return collapsedFallback; }
}

/**
 * Обновляет панель в текущем окне и в других вкладках.
 * @param listener - Обработчик изменения свёрнутости.
 * @returns Функция отписки.
 */
function subscribe(listener: () => void) {
  window.addEventListener(SIDEBAR_STATE_EVENT, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(SIDEBAR_STATE_EVENT, listener);
    window.removeEventListener('storage', listener);
  };
}

/** Меняет общий снимок и уведомляет подписчиков текущего окна. */
function toggleCollapsed() {
  collapsedFallback = !readCollapsed();
  try { window.localStorage.setItem(SIDEBAR_STATE_KEY, String(collapsedFallback)); } catch { /* Значение остаётся в памяти. */ }
  window.dispatchEvent(new Event(SIDEBAR_STATE_EVENT));
}

/**
 * Возвращаемое значение хука useSidebarState
 */
interface SidebarState {
  /** Флаг свёрнутости сайдбара */
  isCollapsed: boolean;
  /** Переключить состояние свёрнутости */
  toggleCollapsed: () => void;
}

/**
 * Хук состояния сайдбара: collapsed/expanded
 * @returns Объект с флагом isCollapsed и функцией toggleCollapsed
 */
export function useSidebarState(): SidebarState {
  const isCollapsed = useSyncExternalStore(subscribe, readCollapsed, () => true);
  return { isCollapsed, toggleCollapsed };
}
