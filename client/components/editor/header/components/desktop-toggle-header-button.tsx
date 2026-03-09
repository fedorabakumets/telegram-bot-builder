/**
 * @fileoverview Десктопная кнопка переключения заголовка
 * @description Кнопка для показа/скрытия шапки в десктопной версии
 */

import { Button } from '@/components/ui/button';
import { NavigationIcon } from 'lucide-react';
import { cn } from '@/lib/bot-generator/utils';

/**
 * Свойства десктопной кнопки переключения заголовка
 */
export interface DesktopToggleHeaderButtonProps {
  /** Видимость заголовка */
  headerVisible?: boolean;
  /** Обработчик клика */
  onClick?: () => void;
}

/**
 * Десктопная кнопка переключения видимости заголовка
 */
export function DesktopToggleHeaderButton({ headerVisible, onClick }: DesktopToggleHeaderButtonProps) {
  return (
    <Button
      variant={headerVisible ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      className={cn(
        'h-8 w-8 p-0 transition-all duration-200 rounded-lg border-0',
        headerVisible
          ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40'
          : 'bg-slate-500/5 dark:bg-slate-700/15 hover:bg-slate-300/40 dark:hover:bg-slate-600/50 text-slate-600 dark:text-slate-400'
      )}
      title={headerVisible ? 'Скрыть шапку' : 'Показать шапку'}
      data-testid="button-toggle-header"
    >
      <NavigationIcon className="w-3.5 h-3.5" />
    </Button>
  );
}
