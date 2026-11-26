/**
 * @fileoverview Компонент сетки переменной и навигации для ввода ответов
 *
 * Содержит два поля:
 * - Имя переменной для сохранения ответа (с выбором из существующих)
 * - Выбор следующего узла для перехода
 */

import { Node } from '@shared/schema';
import { AutoTransitionSection } from './auto-transition-section';
import { Label } from '@/components/ui/label';
import { VariableNameInput } from '../variables/variable-name-input';
import type { Variable } from '../../../inline-rich/types';

/** Пропсы компонента InputNavigationGrid */
interface InputNavigationGridProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Все узлы для выбора */
  getAllNodesFromAllSheets: Array<{ node: Node; sheetName: string }>;
  /** Функция обновления узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
  /** Функция форматирования узла */
  formatNodeDisplay: (node: Node, sheetName: string) => string;
  /** Список доступных переменных */
  availableVariables?: Variable[];
}

/**
 * Компонент сетки переменной и навигации
 *
 * @param {InputNavigationGridProps} props - Пропсы компонента
 * @returns {JSX.Element} Сетка с полями переменной и навигации
 */
export function InputNavigationGrid({
  selectedNode,
  getAllNodesFromAllSheets,
  onNodeUpdate,

  availableVariables = []
}: InputNavigationGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4">
      {/* Variable Name */}
      <div className="flex flex-col p-3 sm:p-3.5 rounded-lg bg-gradient-to-br from-cyan-50/60 to-blue-50/40 dark:from-cyan-950/30 dark:to-blue-950/20 border border-cyan-200/40 dark:border-cyan-700/40 hover:shadow-sm transition-all duration-200">
        <Label className="text-xs sm:text-sm font-semibold text-cyan-700 dark:text-cyan-300 mb-2 flex items-center gap-1.5">
          <i className="fas fa-bookmark text-xs sm:text-sm"></i>
          Переменная
        </Label>
        <VariableNameInput
          value={selectedNode.data.inputVariable || ''}
          onChange={(value) => onNodeUpdate(selectedNode.id, { inputVariable: value })}
          availableVariables={availableVariables}
          placeholder="имя, email, телефон"
        />
        <div className="text-xs text-cyan-600 dark:text-cyan-400 mt-1.5 leading-snug">
          Ключ для сохранения ответа
        </div>
      </div>

      <AutoTransitionSection selectedNode={selectedNode} getAllNodesFromAllSheets={getAllNodesFromAllSheets} onNodeUpdate={onNodeUpdate} afterAnswer />
    </div>
  );
}