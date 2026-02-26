/**
 * @fileoverview Правые панели макета
 * @description Компонент группы правых панелей
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
 * Элемент правой панели
 */
interface RightElement {
  id: string;
  type: string;
  content: ReactNode;
  size: number;
}

/**
 * Пропсы компонента RightPanels
 */
interface RightPanelsProps {
  /** Элементы */
  elements: RightElement[];
  /** Минимальный размер */
  minSize?: number;
  /** Максимальный размер */
  maxSize?: number;
  /** Порядок панели */
  order?: number;
  /** ID панели */
  panelId?: string;
  /** Префикс ID для субпанелей */
  subPanelIdPrefix?: string;
}

/**
 * Стили для resize handle
 */
const HANDLE_CLASS = "bg-gradient-to-r from-transparent via-slate-200/0 to-transparent hover:from-purple-500/15 hover:via-purple-500/30 hover:to-purple-500/15 dark:hover:from-purple-600/15 dark:hover:via-purple-500/25 dark:hover:to-purple-600/15 transition-all duration-300 w-0.5 hover:w-1.5 active:w-2 cursor-col-resize relative flex items-center justify-center group shadow-sm hover:shadow-md";

/**
 * Компонент правой субпанели
 */
function RightSubPanel({ el, index, totalSize, minSize, idPrefix }: {
  el: RightElement;
  index: number;
  totalSize: number;
  minSize: number;
  idPrefix: string;
}) {
  return (
    <>
      {index > 0 && (
        <ResizableHandle key={`handle-${el.id}`} withHandle className={HANDLE_CLASS} />
      )}
      <ResizablePanel
        key={`panel-${el.id}`}
        id={`${idPrefix}-${el.id}`}
        order={index + 1}
        defaultSize={totalSize > 0 ? (el.size / totalSize) * 100 : 50}
        minSize={minSize}
        maxSize={100}
        className="overflow-hidden"
      >
        <div className="h-full w-full overflow-hidden flex flex-col">
          {el.content}
        </div>
      </ResizablePanel>
    </>
  );
}

/**
 * Компонент группы правых панелей
 * @param props - Пропсы компонента
 * @returns JSX элемент
 */
export function RightPanels(props: RightPanelsProps): React.JSX.Element {
  const {
    elements,
    minSize = 15,
    maxSize = 40,
    order = 3,
    panelId = 'right-panel',
    subPanelIdPrefix = 'right-subpanel',
  } = props;

  const hasDialog = elements.some(el => el.type === 'dialog');
  const totalSize = elements.reduce((sum, el) => sum + el.size, 0);
  const rightMinSize = hasDialog ? 10 : minSize;
  const rightMaxSize = hasDialog ? 45 : maxSize;

  return (
    <>
      {hasDialog ? (
        <DialogResizeHandle direction="vertical" />
      ) : (
        <CodeResizeHandle direction="vertical" />
      )}
      <ResizablePanel
        id={panelId}
        order={order}
        defaultSize={totalSize}
        minSize={rightMinSize}
        maxSize={rightMaxSize}
        className="overflow-hidden"
      >
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          {elements.map((el, index) => (
            <RightSubPanel
              key={el.id}
              el={el}
              index={index}
              totalSize={totalSize}
              minSize={rightMinSize}
              idPrefix={subPanelIdPrefix}
            />
          ))}
        </ResizablePanelGroup>
      </ResizablePanel>
    </>
  );
}
