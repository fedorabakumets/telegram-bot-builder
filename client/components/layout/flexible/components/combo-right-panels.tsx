/**
 * @fileoverview Правые панели комбинированного макета
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
 * Пропсы компонента ComboRightPanels
 */
interface ComboRightPanelsProps {
  /** Элементы */
  elements: RightElement[];
  /** Порядок панели */
  order?: number;
}

/**
 * Стили для resize handle
 */
const HANDLE_CLASS = "bg-gradient-to-r from-transparent via-slate-200/0 to-transparent hover:from-purple-500/15 hover:via-purple-500/30 hover:to-purple-500/15 dark:hover:from-purple-600/15 dark:hover:via-purple-500/25 dark:hover:to-purple-600/15 transition-all duration-300 w-0.5 hover:w-1.5 active:w-2 cursor-col-resize relative flex items-center justify-center group shadow-sm hover:shadow-md";

/**
 * Компонент правой субпанели
 */
function ComboRightSubPanel({ el, index, totalSize }: {
  el: RightElement;
  index: number;
  totalSize: number;
}) {
  return (
    <>
      {index > 0 && (
        <ResizableHandle key={`handle-${el.id}`} withHandle className={HANDLE_CLASS} />
      )}
      <ResizablePanel
        key={`panel-${el.id}`}
        id={`combo-right-subpanel-${el.id}`}
        order={index + 1}
        defaultSize={totalSize > 0 ? (el.size / totalSize) * 100 : 50}
        minSize={el.type === 'dialog' ? 10 : 10}
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
export function ComboRightPanels(props: ComboRightPanelsProps): React.JSX.Element {
  const { elements, order = 3 } = props;
  const hasDialog = elements.some(el => el.type === 'dialog');
  const totalSize = elements.reduce((sum, el) => sum + el.size, 0);
  const rightMinSize = hasDialog ? 10 : 15;
  const rightMaxSize = hasDialog ? 45 : 40;

  return (
    <>
      {hasDialog ? (
        <DialogResizeHandle direction="vertical" />
      ) : (
        <CodeResizeHandle direction="vertical" />
      )}
      <ResizablePanel
        id="combo-right-panel"
        order={order}
        defaultSize={totalSize}
        minSize={rightMinSize}
        maxSize={rightMaxSize}
        className="w-full overflow-hidden"
      >
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          {elements.map((el, index) => (
            <ComboRightSubPanel
              key={el.id}
              el={el}
              index={index}
              totalSize={totalSize}
            />
          ))}
        </ResizablePanelGroup>
      </ResizablePanel>
    </>
  );
}
