/**
 * @fileoverview Брендинг сайдбара: логотип, название и версия приложения
 * @description Показывает лого, "BotCraft Studio" и бейдж версии
 */

import { cn } from '@/utils/utils';

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
 * @returns JSX элемент с логотипом, названием и версией
 */
export function SidebarBrand({ isCollapsed }: SidebarBrandProps) {
  return (
    <div className={cn('flex items-center gap-2 min-w-0', isCollapsed && 'justify-center')}>
      {/* Иконка Telegram — всегда видна */}
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
        <i className="fab fa-telegram-plane text-white text-sm" />
      </div>

      {!isCollapsed && (
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-sm font-bold bg-gradient-to-r from-blue-500 to-blue-400 bg-clip-text text-transparent whitespace-nowrap">
            BotCraft Studio
          </span>
          <span className="text-[10px] text-muted-foreground/70 font-medium">
            v2.2
          </span>
        </div>
      )}
    </div>
  );
}
