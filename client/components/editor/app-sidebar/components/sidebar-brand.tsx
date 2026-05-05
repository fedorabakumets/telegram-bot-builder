/**
 * @fileoverview Брендинг сайдбара: логотип и название приложения
 * @description Показывает только лого и "BotCraft Studio" — без названия проекта (оно в шапке)
 */

import { cn } from '@/utils/utils';
import { VersionBadge } from '@/components/editor/header/components/version-badge';

/**
 * Пропсы компонента SidebarBrand
 */
interface SidebarBrandProps {
  /** Свёрнут ли сайдбар */
  isCollapsed?: boolean;
}

/**
 * Брендинговая секция сайдбара — лого + название приложения + версия
 * @param props - Свойства компонента
 * @returns JSX элемент с логотипом и названием приложения
 */
export function SidebarBrand({ isCollapsed }: SidebarBrandProps) {
  return (
    <div className={cn('flex items-center gap-2 min-w-0', isCollapsed && 'justify-center')}>
      {/* Иконка Telegram — всегда видна */}
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
        <i className="fab fa-telegram-plane text-white text-sm" />
      </div>

      {!isCollapsed && (
        <>
          <span className="text-sm font-bold bg-gradient-to-r from-blue-500 to-blue-400 bg-clip-text text-transparent leading-tight whitespace-nowrap">
            BotCraft Studio
          </span>
          <VersionBadge version="2.1.9.0.8" />
        </>
      )}
    </div>
  );
}
