/**
 * @fileoverview Переключатель режима просмотра: Холст / JSON
 * @module CanvasViewToggle
 */

import { Braces, PenLine } from 'lucide-react';
import { cn } from '@/utils/utils';

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
 * Переключатель режимов с синей рамкой активного варианта.
 * @param props - Свойства компонента
 * @returns JSX элемент переключателя
 */
export function CanvasViewToggle({ value, onChange }: CanvasViewToggleProps) {
  return (
    <div className="flex h-7 gap-0.5 p-0.5">
      <button
        type="button"
        aria-pressed={value === 'canvas'}
        onClick={() => onChange('canvas')}
        className={cn(
          'flex h-6 items-center gap-1.5 rounded-sm border px-2 text-xs transition-colors !bg-transparent !bg-none !shadow-none @[360px]:px-3',
          value === 'canvas'
            ? '!border-primary/60 text-primary'
            : '!border-transparent text-muted-foreground hover:text-foreground',
        )}
      >
        <PenLine className="hidden size-3 @[360px]:block" aria-hidden="true" />
        Холст
      </button>
      <button
        type="button"
        aria-pressed={value === 'json'}
        onClick={() => onChange('json')}
        className={cn(
          'flex h-6 items-center gap-1.5 rounded-sm border px-2 text-xs transition-colors !bg-transparent !bg-none !shadow-none @[360px]:px-3',
          value === 'json'
            ? '!border-primary/60 text-primary'
            : '!border-transparent text-muted-foreground hover:text-foreground',
        )}
      >
        <Braces className="hidden size-3 @[360px]:block" aria-hidden="true" />
        JSON
      </button>
    </div>
  );
}
