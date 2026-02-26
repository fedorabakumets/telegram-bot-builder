/**
 * @fileoverview Компонент комбинированного макета
 * @description Макет с верхней панелью и боковыми панелями
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
    topSize = 10,
    leftContent,
    leftType,
    centerContent,
    rightElements,
    bottomContent,
    bottomSize = 100,
  } = props;

  const totalRightSize = rightElements.reduce((sum, el) => sum + el.size, 0);
  const hasDialog = rightElements.some(el => el.type === 'dialog');
  const hasUserDetails = leftType === 'userDetails';
  const centerMinSize = hasDialog || hasUserDetails ? 20 : 50;
  const rightMinSize = hasDialog ? 10 : 15;
  const rightMaxSize = hasDialog ? 45 : 40;

  return (
    <div className="h-full flex flex-col">
      {topContent && (
        <div className="bg-background" style={{ minHeight: `${topSize}rem` }}>
          {topContent}
        </div>
      )}
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {leftContent && (
            <>
              <ResizablePanel
                id="combo-left-panel"
                order={1}
                defaultSize={leftType === 'userDetails' ? 20 : 25}
                minSize={hasUserDetails ? 10 : 15}
                maxSize={hasUserDetails ? 45 : 40}
                className="w-full overflow-hidden"
              >
                <div className="h-full w-full border-r border-border bg-background overflow-hidden">
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
            id="combo-center-panel"
            order={2}
            defaultSize={rightElements.length > 0 ? 60 : 80}
            minSize={centerMinSize}
            maxSize={rightElements.length > 0 ? 80 : 85}
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
                id="combo-right-panel"
                order={3}
                defaultSize={totalRightSize}
                minSize={rightMinSize}
                maxSize={rightMaxSize}
                className="w-full overflow-hidden"
              >
                <ResizablePanelGroup direction="horizontal" className="h-full w-full">
                  {rightElements.flatMap((rightEl, index) => [
                    ...(index > 0 ? (
                      <ResizableHandle
                        key={`handle-${rightEl.id}`}
                        withHandle
                        className="bg-gradient-to-r from-transparent via-slate-200/0 to-transparent hover:from-purple-500/15 hover:via-purple-500/30 hover:to-purple-500/15 dark:hover:from-purple-600/15 dark:hover:via-purple-500/25 dark:hover:to-purple-600/15 transition-all duration-300 w-0.5 hover:w-1.5 active:w-2 cursor-col-resize relative flex items-center justify-center group shadow-sm hover:shadow-md"
                      />
                    ) : []),
                    <ResizablePanel
                      key={`panel-${rightEl.id}`}
                      id={`combo-right-subpanel-${rightEl.id}`}
                      order={index + 1}
                      defaultSize={totalRightSize > 0 ? (rightEl.size / totalRightSize) * 100 : 50}
                      minSize={rightEl.type === 'dialog' ? 10 : 10}
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
      </div>
      {bottomContent && (
        <div className="border-t border-border bg-background" style={{ minHeight: `${bottomSize}px` }}>
          {bottomContent}
        </div>
      )}
    </div>
  );
}
