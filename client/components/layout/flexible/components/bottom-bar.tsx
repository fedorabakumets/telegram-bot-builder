/**
 * @fileoverview Нижняя панель комбинированного макета
 * @description Компонент нижней панели
 */

import React, { ReactNode } from 'react';

/**
 * Пропсы компонента BottomBar
 */
interface BottomBarProps {
  /** Контент */
  children: ReactNode | null;
  /** Размер */
  size?: number;
}

/**
 * Компонент нижней панели
 * @param props - Пропсы компонента
 * @returns JSX элемент или null
 */
export function BottomBar(props: BottomBarProps): React.JSX.Element | null {
  const { children, size = 100 } = props;

  if (!children) return null;

  return (
    <div className="border-t border-border bg-background" style={{ minHeight: `${size}px` }}>
      {children}
    </div>
  );
}
