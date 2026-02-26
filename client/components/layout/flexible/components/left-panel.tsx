/**
 * @fileoverview Универсальный компонент левой панели
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
  minSize?: number;
  /** Максимальный размер */
  maxSize?: number;
  /** ID панели */
  id?: string;
  /** Порядок панели */
  order?: number;
  /** Класс контейнера */
  containerClassName?: string;
}

/**
 * Компонент левой панели
 * @param props - Пропсы компонента
 * @returns JSX элемент
 */
export function LeftPanel(props: LeftPanelProps): React.JSX.Element {
  const {
    children,
    type,
    minSize = 15,
    maxSize = 40,
    id = 'left-panel',
    order = 1,
    containerClassName = 'h-full w-full bg-background overflow-hidden flex flex-col',
  } = props;

  const isUserDetails = type === 'userDetails';
  const finalMinSize = props.minSize ?? (isUserDetails ? 10 : 15);
  const finalMaxSize = props.maxSize ?? (isUserDetails ? 45 : 40);

  return (
    <>
      <ResizablePanel
        id={id}
        order={order}
        defaultSize={isUserDetails ? 20 : 25}
        minSize={finalMinSize}
        maxSize={finalMaxSize}
        className="overflow-hidden"
      >
        <div className={containerClassName}>
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
