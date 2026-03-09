/**
 * @fileoverview Кнопка открытия мобильной панели компонентов
 * @description Кнопка для открытия сайдбара с компонентами на мобильных устройствах
 */

import { Menu } from 'lucide-react';
import { cn } from '@/lib/bot-generator/utils';

/**
 * Свойства кнопки открытия мобильной панели компонентов
 */
export interface MobileSidebarButtonProps {
  /** Обработчик клика */
  onClick?: () => void;
  /** Дополнительные CSS-классы */
  className?: string;
}

/**
 * Кнопка открытия мобильной панели компонентов
 */
export function MobileSidebarButton({ onClick, className }: MobileSidebarButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group p-2 sm:p-2 bg-blue-500/10 dark:bg-blue-400/15 rounded-lg border border-blue-300/30 dark:border-blue-500/20',
        'hover:bg-blue-500/20 dark:hover:bg-blue-400/25 hover:border-blue-400/50 dark:hover:border-blue-400/30',
        'transition-all duration-200 hover:shadow-md hover:shadow-blue-500/25',
        className
      )}
      title="Открыть панель компонентов"
      data-testid="button-mobile-components"
    >
      <Menu className="w-4 h-4 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200" />
    </button>
  );
}
