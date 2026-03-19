/**
 * @fileoverview Компонент кнопок управления раскладкой клавиатуры
 * @module components/editor/properties/components/keyboard/keyboard-layout-actions
 */

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

/** Свойства компонента KeyboardLayoutActions */
export interface KeyboardLayoutActionsProps {
  /** Включена ли автоматическая раскладка */
  autoLayout: boolean;
  /** Обработчик переключения авто-раскладки */
  onToggleAutoLayout: () => void;
  /** Обработчик добавления ряда */
  onAddRow: () => void;
  /** Обработчик удаления ряда */
  onRemoveRow: (index: number) => void;
  /** Количество рядов */
  rowsCount: number;
}

/**
 * Компонент кнопок управления раскладкой клавиатуры
 * Переключатель авто-раскладки и кнопки управления рядами
 */
export function KeyboardLayoutActions({
  autoLayout,
  onToggleAutoLayout,
  onAddRow,
  onRemoveRow,
  rowsCount,
}: KeyboardLayoutActionsProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Switch
          checked={autoLayout}
          onCheckedChange={onToggleAutoLayout}
          id="auto-layout"
        />
        <label htmlFor="auto-layout" className="text-sm">
          Авто-раскладка
        </label>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onAddRow}
          disabled={autoLayout}
        >
          + Ряд
        </Button>

        {rowsCount > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemoveRow(rowsCount - 1)}
            disabled={autoLayout}
          >
            − Ряд
          </Button>
        )}
      </div>
    </div>
  );
}
