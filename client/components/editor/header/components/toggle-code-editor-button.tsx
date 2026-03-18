/**
 * @fileoverview Кнопка переключения видимости редактора кода
 * @description Мобильная кнопка для показа/скрытия редактора кода
 */

import { Button } from '@/components/ui/button';
import { cn } from '@/utils/utils';

/**
 * Свойства кнопки переключения редактора кода
 */
export interface ToggleCodeEditorButtonProps {
  /** Видимость редактора кода */
  codeEditorVisible?: boolean;
  /** Обработчик клика */
  onClick?: () => void;
}

/**
 * Мобильная кнопка переключения видимости редактора кода
 */
export function ToggleCodeEditorButton({ codeEditorVisible, onClick }: ToggleCodeEditorButtonProps) {
  return (
    <Button
      size="sm"
      onClick={onClick}
      className={cn(
        'flex items-center justify-center sm:justify-center gap-2 sm:gap-0 py-2 px-3 sm:py-2.5 sm:px-2 rounded-lg transition-all font-medium text-sm sm:text-xs',
        codeEditorVisible
          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
      )}
      title={codeEditorVisible ? 'Скрыть редактор кода' : 'Показать редактор кода'}
      data-testid="button-mobile-toggle-code-editor"
    >
      <i className="fas fa-file-code sm:w-4 sm:h-4 w-0 sm:flex-shrink-0" />
      <span className="sm:hidden">{codeEditorVisible ? 'Скрыть' : 'Показать'} редактор</span>
    </Button>
  );
}
