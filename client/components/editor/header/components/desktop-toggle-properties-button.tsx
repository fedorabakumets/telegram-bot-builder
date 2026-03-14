/**
 * @fileoverview Десктопная кнопка переключения панели свойств
 * @description Кнопка для показа/скрытия панели свойств в десктопной версии
 */

import { Button } from '@/components/ui/button';
import { Sliders } from 'lucide-react';
import { cn } from '@lib/bot-generator/utils';

/**
 * Свойства десктопной кнопки переключения панели свойств
 */
export interface DesktopTogglePropertiesButtonProps {
  /** Видимость панели свойств */
  propertiesVisible?: boolean;
  /** Обработчик клика */
  onClick?: () => void;
}

/**
 * Десктопная кнопка переключения видимости панели свойств
 */
export function DesktopTogglePropertiesButton({ propertiesVisible, onClick }: DesktopTogglePropertiesButtonProps) {
  return (
    <Button
      variant={propertiesVisible ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      className={cn(
        'h-8 w-8 p-0 transition-all duration-200 rounded-lg border-0',
        propertiesVisible
          ? 'bg-gradient-to-br from-pink-600 to-pink-500 text-white shadow-md shadow-pink-500/30 hover:shadow-lg hover:shadow-pink-500/40'
          : 'bg-slate-500/5 dark:bg-slate-700/15 hover:bg-slate-300/40 dark:hover:bg-slate-600/50 text-slate-600 dark:text-slate-400'
      )}
      title={propertiesVisible ? 'Скрыть панель свойств' : 'Показать панель свойств'}
      data-testid="button-toggle-properties"
    >
      <Sliders className="w-3.5 h-3.5" />
    </Button>
  );
}
