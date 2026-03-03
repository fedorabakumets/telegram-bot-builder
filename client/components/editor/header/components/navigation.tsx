/**
 * @fileoverview Компонент навигации по вкладкам
 * @description Отображает кнопки переключения между разделами редактора
 */

import { cn } from '@/lib/bot-generator/utils';
import type { HeaderTab } from '../types';

/**
 * Свойства компонента навигации
 */
export interface NavigationProps {
  /** Текущая активная вкладка */
  currentTab: HeaderTab;
  /** Обработчик изменения вкладки */
  onTabChange: (tab: HeaderTab) => void;
  /** Вертикальное расположение */
  isVertical?: boolean;
  /** Компактный режим */
  isCompact?: boolean;
  /** Дополнительные CSS-классы */
  className?: string;
}

/** Элементы навигации */
const NAV_ITEMS = [
  { key: 'editor' as HeaderTab, label: 'Редактор' },
  { key: 'export' as HeaderTab, label: 'Код' },
  { key: 'bot' as HeaderTab, label: 'Бот' },
  { key: 'users' as HeaderTab, label: 'Пользователи' },
  { key: 'user-ids' as HeaderTab, label: 'База ID' },
  { key: 'client-api' as HeaderTab, label: 'Client API' },
] as const;

/**
 * Навигация по вкладкам редактора
 */
export function Navigation({ currentTab, onTabChange, isVertical, isCompact, className }: NavigationProps) {
  return (
    <nav
      className={cn(
        isVertical ? 'flex flex-col space-y-1 px-2' : 'hidden md:flex flex-wrap items-center gap-0.5 lg:gap-1 flex-1 justify-center',
        className
      )}
    >
      {NAV_ITEMS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={cn(
            'px-2 md:px-2.5 lg:px-3 py-1 text-xs md:text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap',
            currentTab === tab.key
              ? 'text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-md shadow-blue-500/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 dark:hover:bg-slate-800/50',
            isVertical ? 'w-full text-left' : '',
            isVertical && isCompact && 'truncate'
          )}
        >
          {isVertical && isCompact ? tab.label.substring(0, 3) : tab.label}
        </button>
      ))}
    </nav>
  );
}
