/**
 * @fileoverview Компонент разделителя
 * @description Вертикальный или горизонтальный разделитель для элементов заголовка
 */

import { cn } from '@lib/bot-generator/utils';

/**
 * Свойства компонента разделителя
 */
export interface SeparatorProps {
  /** Вертикальное расположение */
  isVertical?: boolean;
  /** Дополнительные CSS-классы */
  className?: string;
}

/**
 * Разделитель для элементов заголовка
 */
export function Separator({ isVertical, className }: SeparatorProps) {
  return (
    <div
      className={cn(
        'bg-border/50 hidden sm:block',
        isVertical ? 'h-px w-full' : 'h-4 sm:h-5 md:h-6 w-px',
        className
      )}
    />
  );
}
