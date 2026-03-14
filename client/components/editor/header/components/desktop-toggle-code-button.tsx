/**
 * @fileoverview Десктопная кнопка переключения панели кода
 * @description Кнопка для показа/скрытия панели кода в десктопной версии
 */

import { Button } from '@/components/ui/button';
import { Code } from 'lucide-react';
import { cn } from '@lib/bot-generator/utils';

/**
 * Свойства десктопной кнопки переключения панели кода
 */
export interface DesktopToggleCodeButtonProps {
  /** Видимость панели кода */
  codeVisible?: boolean;
  /** Обработчик клика */
  onClick?: () => void;
}

/**
 * Десктопная кнопка переключения видимости панели кода
 */
export function DesktopToggleCodeButton({ codeVisible, onClick }: DesktopToggleCodeButtonProps) {
  return (
    <Button
      variant={codeVisible ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      className={cn(
        'h-8 w-8 p-0 transition-all duration-200 rounded-lg border-0',
        codeVisible
          ? 'bg-gradient-to-br from-orange-600 to-orange-500 text-white shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40'
          : 'bg-slate-500/5 dark:bg-slate-700/15 hover:bg-slate-300/40 dark:hover:bg-slate-600/50 text-slate-600 dark:text-slate-400'
      )}
      title={codeVisible ? 'Скрыть панель кода' : 'Показать панель кода'}
      data-testid="button-toggle-code"
    >
      <Code className="w-3.5 h-3.5" />
    </Button>
  );
}
