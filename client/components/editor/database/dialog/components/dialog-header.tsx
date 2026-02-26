/**
 * @fileoverview Компонент заголовка панели диалога
 * Отображает имя пользователя и кнопку закрытия
 */

import { X, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Свойства заголовка
 */
interface DialogHeaderProps {
  /** Имя пользователя */
  userName: string;
  /** Колбэк закрытия */
  onClose: () => void;
}

/**
 * Компонент заголовка панели диалога
 */
export function DialogHeader({ userName, onClose }: DialogHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2 p-3 border-b">
      <div className="flex items-center gap-2 min-w-0">
        <MessageSquare className="w-5 h-5 flex-shrink-0 text-primary" />
        <div className="min-w-0">
          <h3 className="font-medium text-sm truncate">Диалог</h3>
          <p className="text-xs text-muted-foreground truncate">{userName}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        data-testid="button-close-dialog-panel"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
