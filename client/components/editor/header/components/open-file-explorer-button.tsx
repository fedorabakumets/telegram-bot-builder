/**
 * @fileoverview Кнопка открытия проводника файлов
 * @description Мобильная кнопка для открытия файлового менеджера
 */

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/bot-generator/utils';

/**
 * Свойства кнопки открытия проводника файлов
 */
export interface OpenFileExplorerButtonProps {
  /** Обработчик клика */
  onClick?: () => void;
}

/**
 * Мобильная кнопка открытия проводника файлов
 */
export function OpenFileExplorerButton({ onClick }: OpenFileExplorerButtonProps) {
  return (
    <Button
      size="sm"
      onClick={onClick}
      className={cn(
        'flex items-center justify-center sm:justify-center gap-2 sm:gap-0 py-2 px-3 sm:py-2.5 sm:px-2 rounded-lg transition-all font-medium text-sm sm:text-xs',
        'bg-blue-600 text-white shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40'
      )}
      title="Открыть проводник файлов"
      data-testid="button-mobile-open-file-explorer"
    >
      <i className="fas fa-folder sm:w-4 sm:h-4 w-0 sm:flex-shrink-0" />
      <span className="sm:hidden">Файлы</span>
    </Button>
  );
}
