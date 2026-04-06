/**
 * @fileoverview Список использованных переменных с выбором фильтров
 * @description Отображает переменные из текста и позволяет настроить фильтры
 */

import { VariableFilterToggle } from './VariableFilterToggle';
import type { VariableInfo } from '../utils/extract-variables';

/** Пропсы компонента UsedVariablesList */
interface UsedVariablesListProps {
  /** Переменные, найденные в тексте */
  variables: VariableInfo[];
  /** Текущие фильтры переменных */
  variableFilters?: Record<string, string>;
  /** Функция применения фильтра к переменной */
  onApplyFilter: (variableName: string, filter: string) => void;
}

/**
 * Список использованных переменных с выбором фильтров
 * @param props - Свойства компонента
 * @returns JSX элемент списка или null если переменных нет
 */
export function UsedVariablesList({
  variables,
  variableFilters = {},
  onApplyFilter
}: UsedVariablesListProps) {
  if (variables.length === 0) return null;

  return (
    <div className="space-y-2 p-3 rounded-lg bg-gradient-to-br from-purple-50/40 to-pink-50/20 dark:from-purple-950/30 dark:to-pink-900/20 border border-purple-200/40 dark:border-purple-800/40">
      <div className="flex items-center gap-2 mb-2">
        <i className="fas fa-code text-purple-600 dark:text-purple-400 text-sm"></i>
        <span className="text-xs font-semibold text-purple-800 dark:text-purple-200">
          Использованные переменные
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {variables.map((variable) => (
          <div
            key={variable.name}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-purple-200/40 dark:border-purple-700/40"
          >
            <code className="text-xs font-mono text-purple-700 dark:text-purple-300">
              {`{${variable.name}}`}
            </code>
            <VariableFilterToggle
              variableName={variable.name}
              currentFilter={variableFilters[variable.name]}
              onFilterChange={onApplyFilter}
            />
          </div>
        ))}
      </div>

      <div className="text-xs text-purple-600 dark:text-purple-400 leading-relaxed">
        💡 Фильтры работают с переменными в режиме <strong>"Не перезаписывать"</strong>
      </div>
    </div>
  );
}
