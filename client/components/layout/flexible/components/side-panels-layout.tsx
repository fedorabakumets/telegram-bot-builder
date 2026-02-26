/**
 * @fileoverview Компонент макета с боковыми панелями
 * @description Макет с левой/правой панелью и центральным контентом
 */

import React, { ReactNode } from 'react';
import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { LeftPanel } from './left-panel';
import { RightPanels } from './right-panels';

/**
 * Пропсы компонента SidePanelsLayout
 */
interface SidePanelsLayoutProps {
  /** Контент левой панели */
  leftContent: ReactNode | null;
  /** Тип левого элемента */
  leftType?: string;
  /** Контент центра */
  centerContent: ReactNode;
  /** Размер центра */
  centerSize?: number;
  /** Правые элементы */
  rightElements: Array<{
    id: string;
    type: string;
    content: ReactNode;
    size: number;
  }>;
  /** Размеры для вкладок пользователей */
  isUsersTab: boolean;
}

/**
 * Компонент макета с боковыми панелями
 * @param props - Пропсы компонента
 * @returns JSX элемент
 */
export function SidePanelsLayout(props: SidePanelsLayoutProps): React.JSX.Element {
  const {
    leftContent,
    leftType,
    centerContent,
    centerSize = 50,
    rightElements,
    isUsersTab,
  } = props;

  const centerMinSize = isUsersTab ? 20 : 50;
  const centerMaxSize = isUsersTab ? 80 : (rightElements.length > 0 ? 70 : 85);
  const sideMinSize = isUsersTab ? 10 : 15;
  const sideMaxSize = isUsersTab ? 45 : 40;

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      {leftContent && (
        <LeftPanel
          type={leftType}
          minSize={sideMinSize}
          maxSize={sideMaxSize}
        >
          {leftContent}
        </LeftPanel>
      )}
      <ResizablePanel
        id="center-panel"
        order={2}
        defaultSize={centerSize}
        minSize={centerMinSize}
        maxSize={centerMaxSize}
        className="overflow-hidden"
      >
        <div className="h-full w-full bg-background overflow-hidden flex flex-col">
          {centerContent}
        </div>
      </ResizablePanel>
      {rightElements.length > 0 && (
        <RightPanels
          elements={rightElements}
          minSize={sideMinSize}
          maxSize={sideMaxSize}
        />
      )}
    </ResizablePanelGroup>
  );
}
