/**
 * @fileoverview Центральная панель макета
 * @description Компонент центральной панели
 */

import React, { ReactNode } from 'react';
import { ResizablePanel } from '@/components/ui/resizable';

/**
 * Пропсы компонента CenterPanel
 */
interface CenterPanelProps {
  /** Контент */
  children: ReactNode;
  /** ID панели */
  id?: string;
  /** Порядок */
  order?: number;
  /** Размер по умолчанию */
  defaultSize?: number;
  /** Минимальный размер */
  minSize?: number;
  /** Максимальный размер */
  maxSize?: number;
}

/**
 * Компонент центральной панели
 * @param props - Пропсы компонента
 * @returns JSX элемент
 */
export function CenterPanel(props: CenterPanelProps): React.JSX.Element {
  const {
    children,
    id = 'center-panel',
    order = 2,
    defaultSize = 50,
    minSize = 50,
    maxSize = 85,
  } = props;

  return (
    <ResizablePanel
      id={id}
      order={order}
      defaultSize={defaultSize}
      minSize={minSize}
      maxSize={maxSize}
      className="overflow-hidden"
    >
      <div className="h-full w-full bg-background overflow-hidden flex flex-col">
        {children}
      </div>
    </ResizablePanel>
  );
}
