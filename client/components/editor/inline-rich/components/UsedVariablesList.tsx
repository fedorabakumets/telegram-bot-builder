/**
 * @fileoverview Список использованных переменных с выбором фильтров
 * Отображает все переменные в тексте и позволяет настроить фильтры
 * @module used-variables-list
 */

import { VariableFilterToggle } from './VariableFilterToggle';

import type { Node } from '@shared/schema';

/** Переменная с дополнительной информацией */
export interface VariableInfo {
  /** Имя переменной */
  name: string;
}

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
 * Извлекает переменные из текста и проверяет, включена ли опция "Не перезаписывать"
 * @param text - Текст сообщения
 * @param allNodes - Все узлы проекта
 * @returns Массив найденных переменных с флагом canUseFilter
 */
function extractVariables(text: string, allNodes: Node[]): VariableInfo[] {
  const regex = /\{([^}|]+)(?:\|[^}]+)?\}/g;
  const matches = text.matchAll(regex);
  const variables: VariableInfo[] = [];
  const seen = new Set<string>();

  for (const match of matches) {
    const name = match[1].trim();
    if (!seen.has(name)) {
      seen.add(name);
      // Ищем узел, где создана эта переменная
      const sourceNode = allNodes.find(
        node => node.data.inputVariable === name ||
                node.data.photoInputVariable === name ||
                node.data.videoInputVariable === name ||
                node.data.audioInputVariable === name ||
                node.data.documentInputVariable === name
      );
      // Если узел не найден — переменная не существует, пропускаем
      if (!sourceNode) continue;
      
      // Добавляем переменную только если включено "Не перезаписывать"
      if (sourceNode.data.appendVariable) {
        variables.push({ name });
      }
    }
  }

  return variables;
}

/**
 * Список использованных переменных с выбором фильтров
 * @param {UsedVariablesListProps} props - Пропсы компонента
 * @returns {JSX.Element | null} Компонент списка или null
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
        {variables.map((variable) => {
          const currentFilter = variableFilters[variable.name];

          return (
            <div
              key={variable.name}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-purple-200/40 dark:border-purple-700/40"
            >
              <code className="text-xs font-mono text-purple-700 dark:text-purple-300">
                {`{${variable.name}}`}
              </code>

              <VariableFilterToggle
                variableName={variable.name}
                currentFilter={currentFilter}
                onFilterChange={onApplyFilter}
              />
            </div>
          );
        })}
      </div>

      <div className="text-xs text-purple-600 dark:text-purple-400 leading-relaxed">
        💡 Фильтры работают с переменными в режиме <strong>"Не перезаписывать"</strong>
      </div>
    </div>
  );
}

/**
 * Извлекает переменные из текста (утилита для внешнего использования)
 * @param {string} text - Текст сообщения
 * @returns {Array<{ name: string }>} Массив переменных
 */
export { extractVariables };
