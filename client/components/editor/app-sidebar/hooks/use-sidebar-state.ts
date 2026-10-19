/**
 * @fileoverview Хук управления состоянием свёрнутости сайдбара
 */

import { useState, useCallback, useEffect } from 'react';

const SIDEBAR_STATE_KEY = 'botcraft-sidebar-collapsed';

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
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem(SIDEBAR_STATE_KEY) !== 'false';
  });

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STATE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  return { isCollapsed, toggleCollapsed };
}
