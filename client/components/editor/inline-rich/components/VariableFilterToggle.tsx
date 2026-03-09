/**
 * @fileoverview Переключатель фильтра для переменной
 * Компонент с двумя переключателями: через запятую и в столбик
 * @module variable-filter-toggle
 */

import { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

/** Пропсы компонента VariableFilterToggle */
interface VariableFilterToggleProps {
  /** Имя переменной */
  variableName: string;
  /** Текущий фильтр */
  currentFilter?: string;
  /** Функция обновления фильтра */
  onFilterChange: (variableName: string, filter: string) => void;
}

/**
 * Переключатель фильтра для переменной
 * @param {VariableFilterToggleProps} props - Пропсы компонента
 * @returns {JSX.Element} Компонент переключателя
 */
export function VariableFilterToggle({
  variableName,
  currentFilter,
  onFilterChange
}: VariableFilterToggleProps) {
  const separator = currentFilter ? currentFilter.split('"')[1] || '' : '';
  const isComma = separator === ', ';
  const isNewline = separator === '\n';

  // Если оба включены (невозможное состояние), выключаем оба
  useEffect(() => {
    if (isComma && isNewline) {
      onFilterChange(variableName, '');
    }
  }, [isComma, isNewline, variableName, onFilterChange]);

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-purple-100/30 dark:bg-purple-900/20 border border-purple-200/40 dark:border-purple-800/40">
      <div className="flex items-center gap-1">
        <i className="fas fa-list text-purple-600 dark:text-purple-400 text-xs"></i>
        <Label className="text-xs font-medium text-purple-700 dark:text-purple-300 cursor-pointer">
          Запятая
        </Label>
        <Switch
          checked={isComma}
          onCheckedChange={(checked) => {
            if (checked) {
              // Включаем запятую, выключаем столбик
              onFilterChange(variableName, '|join:", "');
            } else {
              // Выключаем всё
              onFilterChange(variableName, '');
            }
          }}
          className="h-4 w-7"
        />
      </div>
      <div className="w-px h-4 bg-purple-300/30 dark:bg-purple-700/30"></div>
      <div className="flex items-center gap-1">
        <i className="fas fa-align-left text-purple-600 dark:text-purple-400 text-xs"></i>
        <Label className="text-xs font-medium text-purple-700 dark:text-purple-300 cursor-pointer">
          Столбик
        </Label>
        <Switch
          checked={isNewline}
          onCheckedChange={(checked) => {
            if (checked) {
              // Включаем столбик, выключаем запятую
              onFilterChange(variableName, '|join:"\n"');
            } else {
              // Выключаем всё
              onFilterChange(variableName, '');
            }
          }}
          className="h-4 w-7"
        />
      </div>
    </div>
  );
}
