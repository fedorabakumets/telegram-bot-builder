/**
 * @fileoverview Десктопная кнопка загрузки шаблона
 * @description Кнопка для открытия библиотеки шаблонов в десктопной версии
 */

import { Button } from '@/components/ui/button';
import { FolderOpen } from 'lucide-react';
import { cn } from '@/lib/bot-generator/utils';

/**
 * Свойства десктопной кнопки загрузки шаблона
 */
export interface DesktopLoadTemplateButtonProps {
  /** Обработчик клика */
  onClick?: () => void;
  /** Вертикальное расположение */
  isVertical?: boolean;
}

/**
 * Десктопная кнопка загрузки шаблона
 */
export function DesktopLoadTemplateButton({ onClick, isVertical }: DesktopLoadTemplateButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn(
        isVertical ? 'w-full justify-center' : 'flex items-center justify-center',
        'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-sm hover:shadow-md hover:shadow-indigo-500/20',
        'bg-gradient-to-r from-indigo-500/10 to-indigo-400/5 hover:from-indigo-600/20 hover:to-indigo-500/15',
        'border border-indigo-400/30 dark:border-indigo-500/30 hover:border-indigo-500/50 dark:hover:border-indigo-400/50',
        'text-indigo-700 dark:text-indigo-300',
        'max-sm:px-2 max-sm:py-1 max-sm:min-w-0 max-sm:w-full'
      )}
    >
      <FolderOpen className="h-3.5 w-3.5 max-sm:mx-auto" />
      <span className="max-sm:hidden ml-1">Шаблоны</span>
    </Button>
  );
}
