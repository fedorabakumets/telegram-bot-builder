/**
 * @fileoverview Кнопка переключения видимости панели свойств
 * @description Мобильная кнопка для показа/скрытия панели свойств
 */

import { Button } from '@/components/ui/button';
import { Sliders } from 'lucide-react';
import { cn } from '@/lib/bot-generator/utils';

/**
 * Свойства кнопки переключения панели свойств
 */
export interface TogglePropertiesButtonProps {
  /** Видимость панели свойств */
  propertiesVisible?: boolean;
  /** Обработчик клика */
  onClick?: () => void;
}

/**
 * Мобильная кнопка переключения видимости панели свойств
 */
export function TogglePropertiesButton({ propertiesVisible, onClick }: TogglePropertiesButtonProps) {
  return (
    <Button
      size="sm"
      onClick={onClick}
      className={cn(
        'flex items-center justify-center sm:justify-center gap-2 sm:gap-0 py-2 px-3 sm:py-2.5 sm:px-2 rounded-lg transition-all font-medium text-sm sm:text-xs',
        propertiesVisible
          ? 'bg-pink-600 text-white shadow-md shadow-pink-500/30 hover:shadow-lg hover:shadow-pink-500/40'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
      )}
      title={propertiesVisible ? 'Скрыть панель свойств' : 'Показать панель свойств'}
      data-testid="button-mobile-toggle-properties"
    >
      <Sliders className="sm:w-4 sm:h-4 w-0 sm:flex-shrink-0" />
      <span className="sm:hidden">{propertiesVisible ? 'Скрыть' : 'Показать'} свойства</span>
    </Button>
  );
}
