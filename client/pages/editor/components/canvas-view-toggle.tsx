/**
 * @fileoverview Переключатель режима просмотра: Холст / JSON
 * @module CanvasViewToggle
 */

import { Braces, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Возможные режимы отображения редактора */
export type CanvasView = 'canvas' | 'json';

/** Свойства компонента CanvasViewToggle */
interface CanvasViewToggleProps {
  /** Текущий активный режим */
  value: CanvasView;
  /** Обработчик смены режима */
  onChange: (view: CanvasView) => void;
}

/**
 * Segmented-control переключатель между режимами «Холст» и «JSON»
 * @param props - Свойства компонента
 * @returns JSX элемент переключателя
 */
export function CanvasViewToggle({ value, onChange }: CanvasViewToggleProps) {
  return (
    <div className="flex items-center justify-center px-3 py-1.5 border-b bg-background/80 backdrop-blur-sm">
      <div className="flex h-7 rounded-md border bg-muted p-0.5 gap-0">
        <button
          type="button"
          onClick={() => onChange('canvas')}
          className={cn(
            'flex items-center gap-1.5 h-6 px-3 text-xs rounded-sm transition-all',
            value === 'canvas'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <PenLine className="h-3 w-3" />
          Холст
        </button>
        <button
          type="button"
          onClick={() => onChange('json')}
          className={cn(
            'flex items-center gap-1.5 h-6 px-3 text-xs rounded-sm transition-all',
            value === 'json'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Braces className="h-3 w-3" />
          JSON
        </button>
      </div>
    </div>
  );
}
