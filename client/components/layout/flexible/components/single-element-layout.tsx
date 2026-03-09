/**
 * @fileoverview Компонент макета с одним элементом
 * @description Отображает единственный видимый элемент на весь экран
 */

import React, { ReactNode } from 'react';

/**
 * Пропсы компонента SingleElementLayout
 */
interface SingleElementLayoutProps {
  /** Контент элемента */
  children: ReactNode;
}

/**
 * Компонент отображения одного элемента на весь экран
 * @param props - Пропсы компонента
 * @returns JSX элемент
 */
export function SingleElementLayout(props: SingleElementLayoutProps): React.JSX.Element {
  const { children } = props;

  return (
    <div className="h-full w-full overflow-hidden bg-background">
      <div className="h-full w-full">
        {children}
      </div>
    </div>
  );
}
