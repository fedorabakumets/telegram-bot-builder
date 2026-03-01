/**
 * @fileoverview Заголовок пустого состояния панели свойств
 * 
 * Отображает иконку, название и кнопку закрытия.
 */

import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface EmptyStateHeaderProps {
  /** Функция закрытия панели */
  onClose?: () => void;
}

/**
 * Компонент заголовка пустого состояния
 */
export function EmptyStateHeader({ onClose }: EmptyStateHeaderProps) {
  return (
    <div className="p-4 border-b border-border">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-muted/50 rounded-lg flex items-center justify-center">
            <i className="fas fa-sliders-h text-muted-foreground text-sm"></i>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Свойства</h2>
            <p className="text-xs text-muted-foreground">Выберите элемент для настройки</p>
          </div>
        </div>
        {onClose && (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 flex-shrink-0"
            onClick={onClose}
            title="Закрыть панель свойств"
            data-testid="button-close-properties-empty"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
