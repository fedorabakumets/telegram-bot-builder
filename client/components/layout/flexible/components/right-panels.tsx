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
  minSize: number;
  /** Максимальный размер */
  maxSize: number;
}

/**
 * Компонент правой субпанели
 */
function RightSubPanel({ el, index, totalSize, minSize }: {
  el: RightElement;
  index: number;
  totalSize: number;
  minSize: number;
}) {
  return (
    <>
      {index > 0 && <ResizableHandle key={`handle-${el.id}`} withHandle />}
      <ResizablePanel
        key={`panel-${el.id}`}
        id={`right-subpanel-${el.id}`}
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
  const { elements, minSize, maxSize } = props;
  const hasDialog = elements.some(el => el.type === 'dialog');
  const totalSize = elements.reduce((sum, el) => sum + el.size, 0);

  return (
    <>
      {hasDialog ? (
        <DialogResizeHandle direction="vertical" />
      ) : (
        <CodeResizeHandle direction="vertical" />
      )}
      <ResizablePanel
        id="right-panel"
        order={3}
        defaultSize={totalSize}
        minSize={minSize}
        maxSize={maxSize}
        className="overflow-hidden"
      >
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          {elements.map((el, index) => (
            <RightSubPanel
              key={el.id}
              el={el}
              index={index}
              totalSize={totalSize}
              minSize={minSize}
            />
          ))}
        </ResizablePanelGroup>
      </ResizablePanel>
    </>
  );
}
