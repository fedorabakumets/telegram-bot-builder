/**
 * @fileoverview Компонент вертикального макета (верх/низ + центр)
 * @description Макет с верхней панелью и основным контентом.
 * Главная панель использует overflow-hidden, чтобы дочерние компоненты
 * (например, BotLayout) сами управляли прокруткой и не получали лишних отступов.
 */

import React, { ReactNode } from 'react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';

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
    <ResizablePanelGroup direction="vertical" className="h-full gap-0">
      <ResizablePanel
        id="top-panel"
        order={1}
        defaultSize={isMobile ? 7 : topSize}
        minSize={isMobile ? 7 : 15}
        maxSize={30}
        className="p-0 m-0"
      >
        <div className="h-full bg-background overflow-hidden">
          {topContent}
        </div>
      </ResizablePanel>
      <ResizableHandle className="!hidden" style={{ height: 0, margin: 0, padding: 0 }} />
      <ResizablePanel
        id="main-panel"
        order={2}
        defaultSize={isMobile ? 93 : 100 - topSize}
        className="p-0 m-0"
      >
        <div className="h-full bg-background overflow-hidden">
          {centerContent || bottomContent}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
