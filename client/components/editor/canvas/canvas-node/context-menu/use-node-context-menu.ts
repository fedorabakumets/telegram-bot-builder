/**
 * @fileoverview Хук управления состоянием контекстного меню узла
 */

import { useState, useCallback } from 'react';
import { ContextMenuState } from './context-menu-types';

/**
 * Хук для управления видимостью и позицией контекстного меню
 * @returns Состояние меню и обработчики событий
 */
export function useNodeContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState>({ visible: false, position: { x: 0, y: 0 } });

  /** Открывает меню в позиции курсора */
  const open = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ visible: true, position: { x: e.clientX, y: e.clientY } });
  }, []);

  /** Закрывает меню */
  const close = useCallback(() => {
    setMenu(prev => ({ ...prev, visible: false }));
  }, []);

  return { menu, open, close };
}
