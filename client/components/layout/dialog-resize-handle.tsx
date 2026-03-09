/**
 * @fileoverview Компонент ручки изменения размера для панелей диалога
 * Предоставляет визуальный разделитель с градиентными эффектами
 */

import { ResizableHandle } from '@/components/ui/resizable';

/**
 * @interface DialogResizeHandleProps
 * @description Свойства компонента ручки изменения размера
 */
interface DialogResizeHandleProps {
  /** Направление разделителя (вертикальное/горизонтальное) */
  direction?: 'vertical' | 'horizontal';
}

/**
 * @function DialogResizeHandle
 * @description Ручка изменения размера между панелями диалога
 * @param {DialogResizeHandleProps} props - Свойства компонента
 * @returns {JSX.Element} Компонент разделителя
 */
export function DialogResizeHandle({ direction = 'vertical' }: DialogResizeHandleProps) {
  const isVertical = direction === 'vertical';

  return (
    <ResizableHandle
      withHandle
      className={`bg-gradient-to-r from-transparent via-slate-300/0 to-transparent hover:from-blue-500/20 hover:via-blue-500/40 hover:to-blue-500/20 dark:hover:from-blue-600/20 dark:hover:via-blue-500/30 dark:hover:to-blue-600/20 transition-all duration-300 ${isVertical ? 'w-0.5 hover:w-1.5 active:w-2 cursor-col-resize' : 'h-0.5 hover:h-1.5 active:h-2 cursor-row-resize'} active:bg-gradient-to-r active:from-blue-500/30 active:via-blue-600/50 active:to-blue-500/30 relative flex items-center justify-center group shadow-sm hover:shadow-md active:shadow-lg`}
    >
      <div className={`absolute ${isVertical ? 'h-16 md:h-20 w-1.5 md:w-2' : 'w-16 md:w-20 h-1.5 md:h-2'} bg-gradient-to-b from-transparent via-blue-400 dark:via-blue-500 to-transparent opacity-0 group-hover:opacity-100 active:opacity-100 transition-all duration-200 pointer-events-none rounded-full blur-sm`} />
      <div className={`absolute ${isVertical ? 'h-8 w-0.5 md:w-1' : 'w-8 h-0.5 md:h-1'} bg-gradient-to-b from-blue-400 via-blue-500 to-blue-400 dark:from-blue-500 dark:via-blue-400 dark:to-blue-500 opacity-0 group-hover:opacity-60 active:opacity-100 transition-all duration-200 pointer-events-none rounded-full`} />
    </ResizableHandle>
  );
}
