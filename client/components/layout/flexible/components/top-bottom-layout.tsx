/**
 * @fileoverview Компонент вертикального макета (верх/низ + центр)
 * @description Макет с верхней панелью и основным контентом.
 * Главная панель использует overflow-hidden, чтобы дочерние компоненты
 * (например, BotLayout) сами управляли прокруткой и не получали лишних отступов.
 */

import React, { ReactNode } from 'react';

/**
 * Пропсы компонента TopBottomLayout
 */
interface TopBottomLayoutProps {
  /** Контент верхней панели */
  topContent: ReactNode;
  /** Контент центра */
  centerContent: ReactNode | null;
  /** Контент низа */
  bottomContent: ReactNode | null;
  /** Размер верхней панели */
  topSize: number;
  /** Мобильный режим */
  isMobile: boolean;
}

/**
 * Компонент вертикального макета с верхней/нижней панелью
 * @param props - Пропсы компонента
 * @returns JSX элемент
 */
export function TopBottomLayout(props: TopBottomLayoutProps): React.JSX.Element {
  const { topContent, centerContent, bottomContent, topSize, isMobile } = props;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 bg-background overflow-hidden">
        {topContent}
      </div>
      <div className="flex-1 min-h-0 bg-background overflow-hidden">
        {centerContent || bottomContent}
      </div>
    </div>
  );
}
