/**
 * @fileoverview Вертикальная навигация по вкладкам сайдбара
 */

import { LayoutDashboard, Code2, Bot, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/utils';
import type { HeaderTab } from '../types';

/**
 * Пропсы компонента SidebarNav
 */
interface SidebarNavProps {
  /** Текущая активная вкладка */
  currentTab: HeaderTab;
  /** Обработчик смены вкладки */
  onTabChange: (tab: HeaderTab) => void;
  /** Свёрнут ли сайдбар */
  isCollapsed?: boolean;
}

/**
 * Конфигурация одного пункта навигации
 */
interface NavItem {
  /** Идентификатор вкладки */
  tab: HeaderTab;
  /** Отображаемое название */
  label: string;
  /** Иконка из lucide-react */
  icon: React.ComponentType<{ className?: string }>;
}

/** Список активных пунктов навигации */
const NAV_ITEMS: NavItem[] = [
  { tab: 'editor',  label: 'Редактор',     icon: LayoutDashboard },
  { tab: 'export',  label: 'Код',          icon: Code2 },
  { tab: 'bot',     label: 'Бот',          icon: Bot },
  { tab: 'users',   label: 'Пользователи', icon: Users },
];

/**
 * Вертикальный список кнопок навигации по вкладкам
 * @param props - Свойства компонента
 * @returns JSX элемент с кнопками навигации
 */
export function SidebarNav({ currentTab, onTabChange, isCollapsed }: SidebarNavProps) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ tab, label, icon: Icon }) => {
        const isActive = currentTab === tab;
        return (
          <Button
            key={tab}
            variant="ghost"
            onClick={() => onTabChange(tab)}
            className={cn(
              'w-full justify-start gap-2 h-9 px-2',
              isCollapsed && 'justify-center px-0',
              isActive
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600'
                : 'text-muted-foreground hover:bg-muted/60'
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm">{label}</span>}
          </Button>
        );
      })}
    </nav>
  );
}
