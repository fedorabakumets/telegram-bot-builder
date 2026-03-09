/**
 * @fileoverview Компонент ввода имени переменной с кнопкой выбора
 * Позволяет ввести новое имя или выбрать существующее из списка.
 * @module variable-name-input
 */

import { Input } from '@/components/ui/input';
import { VariableSelector } from './variable-selector';
import type { Variable } from '../../../inline-rich/types';

/** Пропсы компонента VariableNameInput */
interface VariableNameInputProps {
  /** Текущее значение переменной */
  value: string;
  /** Список доступных переменных */
  availableVariables: Variable[];
  /** Функция обновления значения */
  onChange: (value: string) => void;
  /** Placeholder для input */
  placeholder?: string;
}

/**
 * Компонент ввода имени переменной с кнопкой выбора.
 * Input всегда доступен для ввода, dropdown открывается только по кнопке.
 * @param {VariableNameInputProps} props - Пропсы компонента
 * @returns {JSX.Element} Input с кнопкой выбора переменной
 */
export function VariableNameInput({
  value,
  availableVariables,
  onChange,
  placeholder = 'имя переменной'
}: VariableNameInputProps) {
  return (
    <div className="flex items-center gap-1">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 text-xs sm:text-sm border-cyan-200/50 dark:border-cyan-700/50 focus:border-cyan-500 focus:ring-cyan-200"
        placeholder={placeholder}
      />
      <VariableSelector
        availableVariables={availableVariables}
        onSelect={onChange}
      />
    </div>
  );
}
