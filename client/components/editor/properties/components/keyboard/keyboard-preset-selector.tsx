/**
 * @fileoverview Компонент выбора пресета раскладки клавиатуры
 * @module components/editor/properties/components/keyboard/keyboard-preset-selector
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { KEYBOARD_PRESETS } from '../../utils/keyboard-presets';

/** Свойства компонента KeyboardPresetSelector */
export interface KeyboardPresetSelectorProps {
  /** Текущее количество колонок */
  columns: number;
  /** Обработчик изменения количества колонок */
  onColumnsChange: (columns: number) => void;
  /** Отключён ли селектор */
  disabled?: boolean;
}

/**
 * Компонент выбора пресета раскладки клавиатуры
 * Позволяет выбрать количество колонок из предустановленных вариантов
 */
export function KeyboardPresetSelector({
  columns,
  onColumnsChange,
  disabled,
}: KeyboardPresetSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Пресет раскладки</label>
      <Select
        value={columns.toString()}
        onValueChange={(value) => onColumnsChange(parseInt(value))}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Выберите пресет" />
        </SelectTrigger>
        <SelectContent>
          {KEYBOARD_PRESETS.map((preset) => (
            <SelectItem key={preset.name} value={preset.columns.toString()}>
              {preset.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        {KEYBOARD_PRESETS.find(p => p.columns === columns)?.description || ''}
      </p>
    </div>
  );
}
