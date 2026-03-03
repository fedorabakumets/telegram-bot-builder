/**
 * @fileoverview Кнопка сохранения шаблона
 * @description Мобильная кнопка для сохранения текущего проекта как шаблона
 */

import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/bot-generator/utils';

/**
 * Свойства кнопки сохранения шаблона
 */
export interface SaveTemplateButtonProps {
  /** Обработчик клика */
  onClick?: () => void;
}

/**
 * Мобильная кнопка сохранения шаблона
 */
export function SaveTemplateButton({ onClick }: SaveTemplateButtonProps) {
  return (
    <Button
      size="sm"
      onClick={onClick}
      className={cn(
        'flex items-center justify-center gap-2 px-3 py-2 sm:py-2.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800/50 rounded-lg font-medium text-xs sm:text-sm transition-all'
      )}
      title="Сохранить как шаблон"
      data-testid="button-mobile-save-template"
    >
      <Bookmark className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
      <span>Сохранить шаблон</span>
    </Button>
  );
}
