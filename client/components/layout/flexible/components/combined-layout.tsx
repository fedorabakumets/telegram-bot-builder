/**
 * @fileoverview Компонент комбинированного макета
 * @description Макет с верхней панелью и боковыми панелями
 */

import React, { ReactNode } from 'react';
import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { TopBar } from './top-bar';
import { BottomBar } from './bottom-bar';
import { ComboLeftPanel } from './combo-left-panel';
import { ComboRightPanels } from './combo-right-panels';

/**
 * Пропсы компонента CombinedLayout
 */
interface CombinedLayoutProps {
  /** Контент верхней панели */
  topContent: ReactNode | null;
  /** Размер верхней панели */
  topSize?: number;
  /** Контент левой панели */
  leftContent: ReactNode | null;
  /** Тип левого элемента */
  leftType?: string;
  /** Контент центра */
  centerContent: ReactNode | null;
  /** Правые элементы */
  rightElements: Array<{
    id: string;
    type: string;
    content: ReactNode;
    size: number;
  }>;
  /** Контент нижней панели */
  bottomContent: ReactNode | null;
  /** Размер нижней панели */
  bottomSize?: number;
}

/**
 * Компонент комбинированного макета
 * @param props - Пропсы компонента
 * @returns JSX элемент
 */
export function CombinedLayout(props: CombinedLayoutProps): React.JSX.Element {
  const {
    topContent,
    topSize,
    leftContent,
    leftType,
    centerContent,
    rightElements,
    bottomContent,
    bottomSize,
  } = props;

  const hasDialog = rightElements.some(el => el.type === 'dialog');
  const hasUserDetails = leftType === 'userDetails';
  const centerMinSize = hasDialog || hasUserDetails ? 20 : 50;
  const centerMaxSize = rightElements.length > 0 ? 80 : 85;

  return (
    <div className="h-full flex flex-col">
      <TopBar size={topSize}>{topContent}</TopBar>
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {leftContent && (
            <ComboLeftPanel type={leftType}>
              {leftContent}
            </ComboLeftPanel>
          )}
          <ResizablePanel
            id="combo-center-panel"
            order={2}
            defaultSize={rightElements.length > 0 ? 60 : 80}
            minSize={centerMinSize}
            maxSize={centerMaxSize}
            className="overflow-hidden"
          >
            <div className="h-full w-full bg-background overflow-hidden flex flex-col">
              {centerContent}
            </div>
          </ResizablePanel>
          {rightElements.length > 0 && (
            <ComboRightPanels elements={rightElements} />
          )}
        </ResizablePanelGroup>
      </div>
      <BottomBar size={bottomSize}>{bottomContent}</BottomBar>
    </div>
  );
}
