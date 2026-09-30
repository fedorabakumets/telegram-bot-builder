/**
 * @fileoverview Компонент навигации по вкладкам
 * @description Отображает кнопки переключения между разделами редактора
 */

import { Bot, LayoutDashboard, Sparkles, Terminal, Users } from 'lucide-react';
import { cn } from '@/utils/utils';
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

/** Элемент навигации */
interface NavItem {
  /** Ключ вкладки */
  key: HeaderTab;
  /** Подпись для подсказки */
  label: string;
  /** Иконка, как в сайдбаре */
  icon: React.ComponentType<{ className?: string }>;
}

/** Элементы навигации в шапке. Горизонтально — только иконки. */
const NAV_ITEMS: NavItem[] = [
  { key: 'editor', label: 'Редактор', icon: LayoutDashboard },
  { key: 'bot', label: 'Бот', icon: Bot },
  { key: 'terminal', label: 'Терминал', icon: Terminal },
  { key: 'users', label: 'Пользователи', icon: Users },
  { key: 'agent', label: 'Агент', icon: Sparkles },
];

/**
 * Навигация по вкладкам. В горизонтальной шапке только иконки, подпись — в подсказке.
 * @param props - Текущая вкладка и обработчик
 * @returns Панель вкладок
 */
export function Navigation({ currentTab, onTabChange, isVertical, isCompact, className }: NavigationProps) {
  return (
    <nav
      className={cn(
        isVertical ? 'flex flex-col space-y-1 px-2' : 'flex shrink-0 flex-nowrap items-center gap-0.5',
        className
      )}
    >
      {NAV_ITEMS.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            type="button"
            title={tab.label}
            onClick={() => onTabChange(tab.key)}
            className={cn(
              'inline-flex items-center rounded-lg transition-all duration-200',
              isVertical ? 'w-full justify-start gap-2 px-2 py-1.5 text-sm font-semibold' : 'h-8 w-8 justify-center',
              currentTab === tab.key
                ? 'text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-md shadow-blue-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 dark:hover:bg-slate-800/50',
              isVertical && isCompact && 'truncate'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {isVertical && <span>{isCompact ? tab.label.substring(0, 3) : tab.label}</span>}
          </button>
        );
      })}
    </nav>
  );
}
