/**
 * @fileoverview Кнопка переключения видимости заголовка
 * @description Мобильная кнопка для показа/скрытия шапки
 */

import { Button } from '@/components/ui/button';
import { NavigationIcon } from 'lucide-react';
import { cn } from '@/lib/bot-generator/utils';

/**
 * Свойства кнопки переключения заголовка
 */
export interface ToggleHeaderButtonProps {
  /** Видимость заголовка */
  headerVisible?: boolean;
  /** Обработчик клика */
  onClick?: () => void;
}

/**
 * Мобильная кнопка переключения видимости заголовка
 */
export function ToggleHeaderButton({ headerVisible, onClick }: ToggleHeaderButtonProps) {
  return (
    <Button
      size="sm"
      onClick={onClick}
      className={cn(
        'flex items-center justify-center sm:justify-center gap-2 sm:gap-0 py-2 px-3 sm:py-2.5 sm:px-2 rounded-lg transition-all font-medium text-sm sm:text-xs',
        headerVisible
          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
      )}
      title={headerVisible ? 'Скрыть шапку' : 'Показать шапку'}
      data-testid="button-mobile-toggle-header"
    >
      <NavigationIcon className="sm:w-4 sm:h-4 w-0 sm:flex-shrink-0" />
      <span className="sm:hidden">{headerVisible ? 'Скрыть' : 'Показать'} шапку</span>
    </Button>
  );
}
