/**
 * @fileoverview Компонент ручки изменения размера для панелей кода
 * Предоставляет визуальный разделитель с градиентными эффектами
 */

import { ResizableHandle } from '@/components/ui/resizable';

/**
 * @interface CodeResizeHandleProps
 * @description Свойства компонента ручки изменения размера
 */
interface CodeResizeHandleProps {
  /** Направление разделителя (вертикальное/горизонтальное) */
  direction?: 'vertical' | 'horizontal';
}

/**
 * @function CodeResizeHandle
 * @description Ручка изменения размера между панелями кода
 * @param {CodeResizeHandleProps} props - Свойства компонента
 * @returns {JSX.Element} Компонент разделителя
 */
export function CodeResizeHandle({ direction = 'vertical' }: CodeResizeHandleProps) {
  const isVertical = direction === 'vertical';

  return (
    <ResizableHandle
      withHandle
      className={`bg-gradient-to-r from-transparent via-slate-300/0 to-transparent hover:from-purple-500/20 hover:via-purple-500/40 hover:to-purple-500/20 dark:hover:from-purple-600/20 dark:hover:via-purple-500/30 dark:hover:to-purple-600/20 transition-all duration-300 ${isVertical ? 'w-0.5 hover:w-1.5 active:w-2 cursor-col-resize' : 'h-0.5 hover:h-1.5 active:h-2 cursor-row-resize'} active:bg-gradient-to-r active:from-purple-500/30 active:via-purple-600/50 active:to-purple-500/30 relative flex items-center justify-center group shadow-sm hover:shadow-md active:shadow-lg`}
    >
      <div className={`absolute ${isVertical ? 'h-16 md:h-20 w-1.5 md:w-2' : 'w-16 md:w-20 h-1.5 md:h-2'} bg-gradient-to-b from-transparent via-purple-400 dark:via-purple-500 to-transparent opacity-0 group-hover:opacity-100 active:opacity-100 transition-all duration-200 pointer-events-none rounded-full blur-sm`} />
      <div className={`absolute ${isVertical ? 'h-8 w-0.5 md:w-1' : 'w-8 h-0.5 md:h-1'} bg-gradient-to-b from-purple-400 via-purple-500 to-purple-400 dark:from-purple-500 dark:via-purple-400 dark:to-purple-500 opacity-0 group-hover:opacity-60 active:opacity-100 transition-all duration-200 pointer-events-none rounded-full`} />
    </ResizableHandle>
  );
}
