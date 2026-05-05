/**
 * @fileoverview Брендинг сайдбара: логотип, полное название проекта и версия
 */

import { cn } from '@/utils/utils';
import type { BotInfo } from '../types';

/**
 * Пропсы компонента SidebarBrand
 */
interface SidebarBrandProps {
  /** Название проекта */
  projectName: string;
  /** Информация о боте */
  botInfo?: BotInfo | null;
  /** Свёрнут ли сайдбар */
  isCollapsed?: boolean;
}

/**
 * Брендинговая секция сайдбара с логотипом, полным названием проекта и версией
 * @param props - Свойства компонента
 * @returns JSX элемент с логотипом и информацией о проекте
 */
export function SidebarBrand({ projectName, botInfo, isCollapsed }: SidebarBrandProps) {
  /** Отображаемое имя: username бота, имя бота или название проекта */
  const displayName = botInfo?.username
    ? `@${botInfo.username}`
    : botInfo?.first_name ?? projectName;

  return (
    <div className={cn('flex flex-col gap-2', isCollapsed && 'items-center')}>
      {/* Верхняя строка: иконка + название приложения + версия */}
      <div className={cn('flex items-center gap-2', isCollapsed && 'justify-center')}>
        {/* Иконка Telegram — всегда видна */}
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
          <i className="fab fa-telegram-plane text-white text-sm" />
        </div>

        {!isCollapsed && (
          <>
            {/* Название приложения */}
            <span className="text-sm font-bold bg-gradient-to-r from-blue-500 to-blue-400 bg-clip-text text-transparent leading-tight">
              BotCraft Studio
            </span>
            {/* Бейдж версии */}
            <span className="ml-auto flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              V 2.1.8
            </span>
          </>
        )}
      </div>

      {/* Полное название проекта — без обрезки, переносится на новую строку */}
      {!isCollapsed && (
        <div className="px-1 py-1 rounded-md bg-muted/50 border border-border/40">
          <span className="text-xs text-foreground font-medium leading-snug break-words">
            {displayName}
          </span>
        </div>
      )}
    </div>
  );
}
