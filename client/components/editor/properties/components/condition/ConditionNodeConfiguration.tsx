/**
 * @fileoverview Панель свойств узла условия.
 * Содержит поле ввода переменной и список веток без возможности добавления новых.
 */
import type { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ConditionBranch } from '@shared/types/condition-node';
import { ConditionBranchItem } from './ConditionBranchItem';

interface ConditionNodeConfigurationProps {
  /** Выбранный узел condition */
  selectedNode: Node;
  /** Все узлы листа — нужны для редактирования message-узлов веток */
  allNodes: Node[];
  /** Все узлы из всех листов для выбора цели перехода */
  getAllNodesFromAllSheets: Array<{ node: Node; sheetName: string }>;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
}

/**
 * Компонент конфигурации узла условия.
 * Отображает поле переменной и список веток без кнопки добавления.
 */
export function ConditionNodeConfiguration({ selectedNode, allNodes, getAllNodesFromAllSheets, onNodeUpdate }: ConditionNodeConfigurationProps) {
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

  return (
    <div className="space-y-4 p-4">
      {/* Поле ввода переменной */}
      <div className="space-y-2">
        <Label>Переменная</Label>
        <Input
          value={variable}
          onChange={e => onNodeUpdate(selectedNode.id, { variable: e.target.value })}
          placeholder="{{name}}, {{возраст}}, {{город}}"
          className="font-mono"
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
              messageNode={messageNode}
              onChange={handleBranchChange}
              onDelete={handleBranchDelete}
              onNodeUpdate={onNodeUpdate}
              getAllNodesFromAllSheets={getAllNodesFromAllSheets}
            />
          );
        })}
      </div>
    </div>
  );
}
