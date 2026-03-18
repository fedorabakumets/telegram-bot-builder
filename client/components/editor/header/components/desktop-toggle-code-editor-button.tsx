/**
 * @fileoverview Десктопная кнопка переключения редактора кода
 * @description Кнопка для показа/скрытия редактора кода в десктопной версии
 */

import { Button } from '@/components/ui/button';
import { cn } from '@/utils/utils';

/**
 * Свойства десктопной кнопки переключения редактора кода
 */
export interface DesktopToggleCodeEditorButtonProps {
  /** Видимость редактора кода */
  codeEditorVisible?: boolean;
  /** Обработчик клика */
  onClick?: () => void;
}

/**
 * Десктопная кнопка переключения видимости редактора кода
 */
export function DesktopToggleCodeEditorButton({ codeEditorVisible, onClick }: DesktopToggleCodeEditorButtonProps) {
  return (
    <Button
      variant={codeEditorVisible ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      className={cn(
        'h-8 w-8 p-0 transition-all duration-200 rounded-lg border-0',
        codeEditorVisible
          ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40'
          : 'bg-slate-500/5 dark:bg-slate-700/15 hover:bg-slate-300/40 dark:hover:bg-slate-600/50 text-slate-600 dark:text-slate-400'
      )}
      title={codeEditorVisible ? 'Скрыть редактор кода' : 'Показать редактор кода'}
      data-testid="button-toggle-code-editor"
    >
      <i className="fas fa-file-code w-3.5 h-3.5" />
    </Button>
  );
}
