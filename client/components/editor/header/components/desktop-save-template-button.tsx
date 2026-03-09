/**
 * @fileoverview Десктопная кнопка сохранения шаблона
 * @description Кнопка для сохранения проекта как шаблона в десктопной версии
 */

import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/bot-generator/utils';

/**
 * Свойства десктопной кнопки сохранения шаблона
 */
export interface DesktopSaveTemplateButtonProps {
  /** Обработчик клика */
  onClick?: () => void;
  /** Вертикальное расположение */
  isVertical?: boolean;
}

/**
 * Десктопная кнопка сохранения шаблона
 */
export function DesktopSaveTemplateButton({ onClick, isVertical }: DesktopSaveTemplateButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn(
        isVertical ? 'w-full justify-center' : 'flex items-center justify-center',
        'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-sm hover:shadow-md hover:shadow-amber-500/20',
        'bg-gradient-to-r from-amber-500/10 to-amber-400/5 hover:from-amber-600/20 hover:to-amber-500/15',
        'border border-amber-400/30 dark:border-amber-500/30 hover:border-amber-500/50 dark:hover:border-amber-400/50',
        'text-amber-700 dark:text-amber-300',
        'max-sm:px-2 max-sm:py-1 max-sm:min-w-0 max-sm:w-full'
      )}
    >
      <Bookmark className="h-3.5 w-3.5 max-sm:mx-auto" />
      <span className="max-sm:hidden ml-1">Сохранить шаблон</span>
    </Button>
  );
}
