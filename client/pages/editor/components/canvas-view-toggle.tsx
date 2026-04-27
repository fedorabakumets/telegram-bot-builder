/**
 * @fileoverview Переключатель режима просмотра: Холст / JSON
 * @module CanvasViewToggle
 */

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Braces, PenLine } from 'lucide-react';

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
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(v) => { if (v) onChange(v as CanvasView); }}
        className="h-7 rounded-md border bg-muted p-0.5 gap-0"
      >
        <ToggleGroupItem
          value="canvas"
          className="h-6 px-3 text-xs rounded-sm data-[state=on]:bg-background data-[state=on]:shadow-sm gap-1.5"
        >
          <PenLine className="h-3 w-3" />
          Холст
        </ToggleGroupItem>
        <ToggleGroupItem
          value="json"
          className="h-6 px-3 text-xs rounded-sm data-[state=on]:bg-background data-[state=on]:shadow-sm gap-1.5"
        >
          <Braces className="h-3 w-3" />
          JSON
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
