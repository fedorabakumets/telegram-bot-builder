/**
 * @fileoverview Десктопная кнопка переключения холста
 * @description Кнопка для показа/скрытия холста в десктопной версии
 */

import { Button } from '@/components/ui/button';
import { Monitor } from 'lucide-react';
import { cn } from '@/utils/utils';

/**
 * Свойства десктопной кнопки переключения холста
 */
export interface DesktopToggleCanvasButtonProps {
  /** Видимость холста */
  canvasVisible?: boolean;
  /** Обработчик клика */
  onClick?: () => void;
}

/**
 * Десктопная кнопка переключения видимости холста
 */
export function DesktopToggleCanvasButton({ canvasVisible, onClick }: DesktopToggleCanvasButtonProps) {
  return (
    <Button
      variant={canvasVisible ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      className={cn(
        'h-8 w-8 p-0 transition-all duration-200 rounded-lg border-0',
        canvasVisible
          ? 'bg-gradient-to-br from-cyan-600 to-cyan-500 text-white shadow-md shadow-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/40'
          : 'bg-slate-500/5 dark:bg-slate-700/15 hover:bg-slate-300/40 dark:hover:bg-slate-600/50 text-slate-600 dark:text-slate-400'
      )}
      title={canvasVisible ? 'Скрыть холст' : 'Показать холст'}
      data-testid="button-toggle-canvas"
    >
      <Monitor className="w-3.5 h-3.5" />
    </Button>
  );
}
