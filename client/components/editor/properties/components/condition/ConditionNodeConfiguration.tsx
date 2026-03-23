/**
 * @fileoverview Панель свойств узла условия.
 * Содержит поле ввода переменной и список веток без возможности добавления новых.
 */
import type { Node } from '@shared/schema';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { ConditionBranch } from '@shared/types/condition-node';
import { ConditionBranchItem } from './ConditionBranchItem';
import type { Variable } from '../../../inline-rich/types';
import { VariableNameInput } from '../variables/variable-name-input';

interface ConditionNodeConfigurationProps {
  /** Выбранный узел condition */
  selectedNode: Node;
  /** Все узлы листа — нужны для редактирования message-узлов веток */
  allNodes: Node[];
  /** Все узлы из всех листов для выбора цели перехода */
  getAllNodesFromAllSheets: Array<{ node: Node; sheetName: string }>;
  /** Доступные переменные для выбора */
  textVariables: Variable[];
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
}

/**
 * Компонент конфигурации узла условия.
 * Отображает поле переменной и список веток без кнопки добавления.
 */
export function ConditionNodeConfiguration({ selectedNode, allNodes, getAllNodesFromAllSheets, textVariables, onNodeUpdate }: ConditionNodeConfigurationProps) {
  const data = selectedNode.data as any;
  const variable: string = data?.variable || '';
  const branches: ConditionBranch[] = data?.branches || [];

  /**
   * Обновляет поле ветки по её идентификатору.
   * @param id - идентификатор ветки
   * @param field - изменяемое поле
   * @param value - новое значение
   */
  const handleBranchChange = (id: string, field: keyof ConditionBranch, value: string) => {
    const updated = branches.map(b => b.id === id ? { ...b, [field]: value } : b);
    onNodeUpdate(selectedNode.id, { branches: updated });
  };

  /**
   * Удаляет ветку по её идентификатору.
   * @param id - идентификатор ветки для удаления
   */
  const handleBranchDelete = (id: string) => {
    onNodeUpdate(selectedNode.id, { branches: branches.filter(b => b.id !== id) });
  };

  /** Добавляет новую ветку с оператором filled перед веткой else */
  const handleBranchAdd = () => {
    const newBranch: ConditionBranch = {
      id: `branch_${Date.now()}`,
      label: '',
      operator: 'filled',
      value: '',
    };
    const elseIndex = branches.findIndex(b => b.operator === 'else');
    const updated = elseIndex >= 0
      ? [...branches.slice(0, elseIndex), newBranch, ...branches.slice(elseIndex)]
      : [...branches, newBranch];
    onNodeUpdate(selectedNode.id, { branches: updated });
  };

  return (
    <div className="space-y-4 p-4">
      {/* Поле ввода переменной */}
      <div className="space-y-2">
        <Label>Переменная</Label>
        <VariableNameInput
          value={variable}
          availableVariables={textVariables}
          onChange={(val) => onNodeUpdate(selectedNode.id, { variable: val })}
          placeholder="{{name}}, {{возраст}}, {{город}}"
        />
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Укажите переменную, которую хотите проверить
        </p>
      </div>

      {/* Список веток условия */}
      <div className="space-y-2">
        {branches.map(branch => {
          /** Находим message-узел для этой ветки по ID */
          const messageNode = allNodes.find(n =>
            n.type === 'message' && (n.data as any).condSourceId === branch.id
          ) ?? null;
          return (
            <ConditionBranchItem
              key={branch.id}
              branch={branch}
              variable={variable}
              messageNode={messageNode}
              onChange={handleBranchChange}
              onDelete={handleBranchDelete}
              onNodeUpdate={onNodeUpdate}
              getAllNodesFromAllSheets={getAllNodesFromAllSheets}
            />
          );
        })}
        <Button
          variant="outline"
          size="sm"
          onClick={handleBranchAdd}
          className="w-full border-dashed border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-400"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Добавить условие
        </Button>
      </div>
    </div>
  );
}
