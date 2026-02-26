/**
 * @fileoverview Верхняя панель комбинированного макета
 * @description Компонент верхней панели
 */

import React, { ReactNode } from 'react';

/**
 * Пропсы компонента TopBar
 */
interface TopBarProps {
  /** Контент */
  children: ReactNode | null;
  /** Размер */
  size?: number;
}

/**
 * Компонент верхней панели
 * @param props - Пропсы компонента
 * @returns JSX элемент или null
 */
export function TopBar(props: TopBarProps): React.JSX.Element | null {
  const { children, size = 10 } = props;

  if (!children) return null;

  return (
    <div className="bg-background" style={{ minHeight: `${size}rem` }}>
      {children}
    </div>
  );
}
