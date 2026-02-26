/**
 * @fileoverview Компонент макета с боковыми панелями
 * @description Макет с левой/правой панелью и центральным контентом
 */

import React, { ReactNode } from 'react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { CodeResizeHandle } from '../../code-resize-handle';
import { DialogResizeHandle } from '../../dialog-resize-handle';

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
  const hasDialog = rightElements.some(el => el.type === 'dialog');
  const totalRightSize = rightElements.reduce((sum, el) => sum + el.size, 0);

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      {leftContent && (
        <>
          <ResizablePanel
            id="left-panel"
            order={1}
            defaultSize={leftType === 'userDetails' ? 20 : 25}
            minSize={sideMinSize}
            maxSize={sideMaxSize}
            className="overflow-hidden"
          >
            <div className="h-full w-full bg-background overflow-hidden flex flex-col">
              {leftContent}
            </div>
          </ResizablePanel>
          {leftType === 'userDetails' ? (
            <DialogResizeHandle direction="vertical" />
          ) : (
            <CodeResizeHandle direction="vertical" />
          )}
        </>
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
        <>
          {hasDialog ? (
            <DialogResizeHandle direction="vertical" />
          ) : (
            <CodeResizeHandle direction="vertical" />
          )}
          <ResizablePanel
            id="right-panel"
            order={3}
            defaultSize={totalRightSize}
            minSize={sideMinSize}
            maxSize={sideMaxSize}
            className="overflow-hidden"
          >
            <ResizablePanelGroup direction="horizontal" className="h-full w-full">
              {rightElements.flatMap((rightEl, index) => [
                ...(index > 0 ? [<ResizableHandle key={`handle-${rightEl.id}`} withHandle />] : []),
                <ResizablePanel
                  key={`panel-${rightEl.id}`}
                  id={`right-subpanel-${rightEl.id}`}
                  order={index + 1}
                  defaultSize={totalRightSize > 0 ? (rightEl.size / totalRightSize) * 100 : 50}
                  minSize={sideMinSize}
                  maxSize={100}
                  className="overflow-hidden"
                >
                  <div className="h-full w-full overflow-hidden flex flex-col">
                    {rightEl.content}
                  </div>
                </ResizablePanel>
              ])}
            </ResizablePanelGroup>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
}
