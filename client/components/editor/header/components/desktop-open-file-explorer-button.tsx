/**
 * @fileoverview Десктопная кнопка открытия проводника файлов
 * @description Кнопка для открытия файлового менеджера в десктопной версии
 */

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/bot-generator/utils';

/**
 * Свойства десктопной кнопки открытия проводника файлов
 */
export interface DesktopOpenFileExplorerButtonProps {
  /** Обработчик клика */
  onClick?: () => void;
}

/**
 * Десктопная кнопка открытия проводника файлов
 */
export function DesktopOpenFileExplorerButton({ onClick }: DesktopOpenFileExplorerButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn(
        'h-8 w-8 p-0 transition-all duration-200 rounded-lg border-0',
        'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40'
      )}
      title="Открыть проводник файлов"
      data-testid="button-open-file-explorer"
    >
      <i className="fas fa-folder w-3.5 h-3.5" />
    </Button>
  );
}
