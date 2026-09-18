/**
 * @fileoverview Поле имени переменной для аргументов команды
 * @module components/editor/properties/components/trigger/command-args-variable-field
 */

import { Label } from '@/components/ui/label';
import { VariableNameInput } from '../variables/variable-name-input';
import type { Variable } from '../../../inline-rich/types';

/**
 * Пропсы поля сохранения аргументов команды
 */
interface CommandArgsVariableFieldProps {
  /** Текущее имя переменной */
  value: string;
  /** Переменные проекта для выбора */
  availableVariables: Variable[];
  /** Обновление имени переменной */
  onChange: (value: string) => void;
}

/**
 * Ввод имени переменной с селектором существующих
 *
 * @param props - Свойства поля
 * @returns JSX элемент поля
 */
export function CommandArgsVariableField({
  value,
  availableVariables,
  onChange,
}: CommandArgsVariableFieldProps) {
  return (
    <div className="space-y-2">
      <Label>Сохранить аргументы в переменную</Label>
      <VariableNameInput
        value={value}
        availableVariables={availableVariables}
        onChange={onChange}
        placeholder="donate_amount"
      />
      <p className="text-xs text-muted-foreground">
        Для <code className="text-[10px]">/donate 777</code> в переменную попадёт{' '}
        <code className="text-[10px]">777</code>. Пусто — не сохранять.
      </p>
    </div>
  );
}
