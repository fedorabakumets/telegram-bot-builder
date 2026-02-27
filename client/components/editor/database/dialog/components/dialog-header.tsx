/**
 * @fileoverview Компонент заголовка панели диалога
 * Отображает иконку и кнопку закрытия
 */

import { X, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Свойства заголовка
 */
interface DialogHeaderProps {
  /** Колбэк закрытия */
  onClose: () => void;
}

/**
 * Компонент заголовка панели диалога
 */
export function DialogHeader({ onClose }: DialogHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2 p-2 xs:p-2.5 sm:p-3 border-b">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-7 xs:w-7 sm:w-8 h-7 xs:h-7 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
          <MessageSquare className="w-3.5 xs:w-3.5 sm:w-4 h-3.5 xs:h-3.5 sm:h-4 text-white" />
        </div>
        <div className="min-w-0">
          <h3 className="font-medium text-xs xs:text-xs sm:text-sm truncate">Диалог</h3>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        data-testid="button-close-dialog-panel"
        className="h-7 w-7 xs:h-8 xs:w-8 sm:h-9 sm:w-9 flex-shrink-0"
      >
        <X className="w-3.5 xs:w-4 h-3.5 xs:h-4" />
      </Button>
    </div>
  );
}
