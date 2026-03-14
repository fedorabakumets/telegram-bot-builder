/**
 * @fileoverview Компонент названия проекта
 * @description Отображает название проекта или бота с адаптивным размером текста
 */

import { cn } from '@lib/bot-generator/utils';
import type { BotInfo } from '../types';

/**
 * Свойства компонента названия
 */
export interface TitleProps {
  /** Название проекта */
  projectName: string;
  /** Информация о боте */
  botInfo?: BotInfo | null;
  /** Вертикальное расположение */
  isVertical?: boolean;
  /** Компактный режим */
  isCompact?: boolean;
  /** Мобильный режим */
  isMobile?: boolean;
  /** Дополнительные CSS-классы */
  className?: string;
}

/**
 * Название проекта с отображением имени бота
 */
export function Title({ projectName, botInfo, isVertical, isCompact, isMobile, className }: TitleProps) {
  const displayName = botInfo?.first_name || projectName;
  const truncatedName = isVertical && !isCompact && displayName.length > 12
    ? displayName.substring(0, 12) + '...'
    : displayName;

  return (
    <div className={cn('min-w-0', isVertical ? 'text-center' : '', className)}>
      <h1
        className={cn(
          'font-bold bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent leading-tight truncate',
          isMobile ? 'text-sm' : 'text-sm md:text-base lg:text-lg'
        )}
      >
        {isVertical && !isCompact ? 'BotCraft' : isMobile ? 'BotCraft' : 'BotCraft Studio'}
      </h1>
      <div
        className={cn(
          'flex items-center gap-1.5',
          isMobile ? 'hidden' : '',
          isVertical ? 'justify-center' : ''
        )}
      >
        <div className="px-2 py-0.5 bg-gradient-to-r from-blue-50/60 to-cyan-50/40 dark:from-blue-950/40 dark:to-cyan-950/30 rounded-md border border-blue-200/50 dark:border-blue-800/50 backdrop-blur-sm">
          <p className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100 truncate max-w-xs">
            {truncatedName}
          </p>
        </div>
      </div>
    </div>
  );
}
