/**
 * @fileoverview Кнопка открытия мобильной панели свойств
 * @description Кнопка для открытия панели свойств на мобильных устройствах
 */

import { Sliders } from 'lucide-react';
import { cn } from '@/utils/utils';

/**
 * Свойства кнопки открытия мобильной панели свойств
 */
export interface MobilePropertiesButtonProps {
  /** Обработчик клика */
  onClick?: () => void;
  /** Дополнительные CSS-классы */
  className?: string;
}

/**
 * Кнопка открытия мобильной панели свойств
 */
export function MobilePropertiesButton({ onClick, className }: MobilePropertiesButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group p-2 sm:p-2 bg-purple-500/10 dark:bg-purple-400/15 rounded-lg border border-purple-300/30 dark:border-purple-500/20',
        'hover:bg-purple-500/20 dark:hover:bg-purple-400/25 hover:border-purple-400/50 dark:hover:border-purple-400/30',
        'transition-all duration-200 hover:shadow-md hover:shadow-purple-500/25',
        className
      )}
      title="Открыть панель свойств"
      data-testid="button-mobile-properties"
    >
      <Sliders className="w-4 h-4 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-200" />
    </button>
  );
}
