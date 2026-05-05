/**
 * @fileoverview Хук управления состоянием свёрнутости сайдбара
 */

import { useState, useCallback } from 'react';

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
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  return { isCollapsed, toggleCollapsed };
}
