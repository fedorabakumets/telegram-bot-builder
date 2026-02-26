/**
 * @fileoverview Левая панель комбинированного макета
 * @description Компонент левой панели с resize-ручкой
 */

import React, { ReactNode } from 'react';
import { ResizablePanel } from '@/components/ui/resizable';
import { CodeResizeHandle } from '../../code-resize-handle';
import { DialogResizeHandle } from '../../dialog-resize-handle';

/**
 * Пропсы компонента ComboLeftPanel
 */
interface ComboLeftPanelProps {
  /** Контент */
  children: ReactNode;
  /** Тип элемента */
  type?: string;
}

/**
 * Компонент левой панели комбинированного макета
 * @param props - Пропсы компонента
 * @returns JSX элемент
 */
export function ComboLeftPanel(props: ComboLeftPanelProps): React.JSX.Element {
  const { children, type } = props;
  const isUserDetails = type === 'userDetails';

  return (
    <>
      <ResizablePanel
        id="combo-left-panel"
        order={1}
        defaultSize={isUserDetails ? 20 : 25}
        minSize={isUserDetails ? 10 : 15}
        maxSize={isUserDetails ? 45 : 40}
        className="w-full overflow-hidden"
      >
        <div className="h-full w-full border-r border-border bg-background overflow-hidden">
          {children}
        </div>
      </ResizablePanel>
      {isUserDetails ? (
        <DialogResizeHandle direction="vertical" />
      ) : (
        <CodeResizeHandle direction="vertical" />
      )}
    </>
  );
}
