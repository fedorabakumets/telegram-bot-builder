/**
 * @fileoverview Компонент логотипа Telegram
 * @description Отображает иконку Telegram в градиентном контейнере
 */

import { cn } from '@/utils/utils';

/**
 * Свойства компонента логотипа
 */
export interface LogoProps {
  /** Дополнительные CSS-классы */
  className?: string;
  /** Вертикальное расположение */
  isVertical?: boolean;
  /** Компактный режим */
  isCompact?: boolean;
}

/**
 * Логотип Telegram с градиентным фоном
 */
export function Logo({ className, isVertical, isCompact }: LogoProps) {
  return (
    <div
      className={cn(
        'bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0',
        'w-8 h-8 sm:w-8 sm:h-8 md:w-9 md:h-9',
        className
      )}
    >
      <i className={cn('fab fa-telegram-plane text-white', isCompact ? 'text-sm' : 'text-sm sm:text-sm md:text-base')} />
    </div>
  );
}
