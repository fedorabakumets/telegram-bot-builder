/**
 * @fileoverview Кнопка переключения видимости панели кода
 * @description Мобильная кнопка для показа/скрытия панели кода
 */

import { Button } from '@/components/ui/button';
import { Code } from 'lucide-react';
import { cn } from '@lib/bot-generator/utils';

/**
 * Свойства кнопки переключения панели кода
 */
export interface ToggleCodeButtonProps {
  /** Видимость панели кода */
  codeVisible?: boolean;
  /** Обработчик клика */
  onClick?: () => void;
}

/**
 * Мобильная кнопка переключения видимости панели кода
 */
export function ToggleCodeButton({ codeVisible, onClick }: ToggleCodeButtonProps) {
  return (
    <Button
      size="sm"
      onClick={onClick}
      className={cn(
        'flex items-center justify-center sm:justify-center gap-2 sm:gap-0 py-2 px-3 sm:py-2.5 sm:px-2 rounded-lg transition-all font-medium text-sm sm:text-xs',
        codeVisible
          ? 'bg-orange-600 text-white shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
      )}
      title={codeVisible ? 'Скрыть панель кода' : 'Показать панель кода'}
      data-testid="button-mobile-toggle-code"
    >
      <Code className="sm:w-4 sm:h-4 w-0 sm:flex-shrink-0" />
      <span className="sm:hidden">{codeVisible ? 'Скрыть' : 'Показать'} код</span>
    </Button>
  );
}
