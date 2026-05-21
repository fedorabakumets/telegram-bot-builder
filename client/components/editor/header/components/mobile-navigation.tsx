/**
 * @fileoverview Компонент мобильной навигации
 * @description Отображает сетку кнопок переключения вкладок для мобильных устройств
 */

import { cn } from '@/utils/utils';
import type { HeaderTab } from '../types';

/**
 * Свойства компонента мобильной навигации
 */
export interface MobileNavigationProps {
  /** Текущая активная вкладка */
  currentTab: HeaderTab;
  /** Обработчик изменения вкладки */
  onTabChange: (tab: HeaderTab) => void;
  /** Обработчик закрытия меню */
  onClose?: () => void;
  /** Дополнительные CSS-классы */
  className?: string;
}

/** Элемент навигации */
interface NavItem {
  /** Ключ вкладки */
  key: HeaderTab;
  /** Отображаемое название */
  label: string;
}

/** Элементы навигации в шапке */
const NAV_ITEMS: NavItem[] = [
  { key: 'editor', label: 'Редактор' },
  { key: 'bot', label: 'Бот' },
  { key: 'terminal', label: 'Терминал' },
  { key: 'users', label: 'Пользователи' },
];

/**
 * Мобильная навигация по вкладкам (сетка 2 колонки)
 */
export function MobileNavigation({ currentTab, onTabChange, onClose, className }: MobileNavigationProps) {
  const handleClick = (tab: HeaderTab) => {
    onTabChange(tab);
    onClose?.();
  };

  return (
    <div className={cn('flex flex-col space-y-4', className)}>
      <div className="grid grid-cols-2 gap-2">
        {NAV_ITEMS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleClick(tab.key)}
            className={cn(
              'px-3 py-2 text-sm font-medium rounded-md transition-colors',
              currentTab === tab.key
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
