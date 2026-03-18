/**
 * @fileoverview Кнопка загрузки сценария
 * @description Мобильная кнопка для открытия библиотеки сценариев
 */

import { Button } from '@/components/ui/button';
import { FolderOpen } from 'lucide-react';
import { cn } from '@/utils/utils';

/**
 * Свойства кнопки загрузки сценария
 */
export interface LoadTemplateButtonProps {
  /** Обработчик клика */
  onClick?: () => void;
}

/**
 * Мобильная кнопка загрузки сценария
 */
export function LoadTemplateButton({ onClick }: LoadTemplateButtonProps) {
  return (
    <Button
      size="sm"
      onClick={onClick}
      className={cn(
        'flex items-center justify-center gap-2 px-3 py-2 sm:py-2.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/50 rounded-lg font-medium text-xs sm:text-sm transition-all'
      )}
      title="Загрузить сценарий"
      data-testid="button-mobile-load-template"
    >
      <FolderOpen className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
      <span>Сценарии</span>
    </Button>
  );
}
