/**
 * @fileoverview Левая панель макета
 * @description Компонент левой панели с resize-ручкой
 */

import React, { ReactNode } from 'react';
import { ResizablePanel } from '@/components/ui/resizable';
import { CodeResizeHandle } from '../../code-resize-handle';
import { DialogResizeHandle } from '../../dialog-resize-handle';

/**
 * Пропсы компонента LeftPanel
 */
interface LeftPanelProps {
  /** Контент панели */
  children: ReactNode;
  /** Тип элемента */
  type?: string;
  /** Минимальный размер */
  minSize: number;
  /** Максимальный размер */
  maxSize: number;
}

/**
 * Компонент левой панели
 * @param props - Пропсы компонента
 * @returns JSX элемент
 */
export function LeftPanel(props: LeftPanelProps): React.JSX.Element {
  const { children, type, minSize, maxSize } = props;

  return (
    <>
      <ResizablePanel
        id="left-panel"
        order={1}
        defaultSize={type === 'userDetails' ? 20 : 25}
        minSize={minSize}
        maxSize={maxSize}
        className="overflow-hidden"
      >
        <div className="h-full w-full bg-background overflow-hidden flex flex-col">
          {children}
        </div>
      </ResizablePanel>
      {type === 'userDetails' ? (
        <DialogResizeHandle direction="vertical" />
      ) : (
        <CodeResizeHandle direction="vertical" />
      )}
    </>
  );
}
