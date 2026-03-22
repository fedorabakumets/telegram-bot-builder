/**
 * @fileoverview Панель свойств узла условия
 *
 * Позволяет редактировать переменную и список веток
 * для узла типа `condition` в панели свойств редактора.
 *
 * @module components/editor/properties/components/condition/ConditionNodeConfiguration
 */

import type { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { ConditionBranch } from '@shared/types/condition-node';
import { ConditionBranchItem } from './ConditionBranchItem';

/**
 * Пропсы компонента ConditionNodeConfiguration
 */
interface ConditionNodeConfigurationProps {
  /** Выбранный узел типа condition */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
}

/**
 * Компонент настройки узла условия
 *
 * Отображает поле переменной и список веток с возможностью
 * добавления, редактирования и удаления.
 *
 * @param props - Пропсы компонента
 * @returns JSX-элемент панели настроек узла условия
 */
export function ConditionNodeConfiguration({ selectedNode, onNodeUpdate }: ConditionNodeConfigurationProps) {
  const data = selectedNode.data as any;
  const variable: string = data?.variable || '';
  const branches: ConditionBranch[] = data?.branches || [];

  /** Обновить поле ветки */
  const handleBranchChange = (id: string, field: keyof ConditionBranch, value: string) => {
    const updated = branches.map(b => b.id === id ? { ...b, [field]: value } : b);
    onNodeUpdate(selectedNode.id, { branches: updated });
  };

  /** Удалить ветку (кроме "else") */
  const handleBranchDelete = (id: string) => {
    onNodeUpdate(selectedNode.id, { branches: branches.filter(b => b.id !== id) });
  };

  /** Добавить новую ветку перед веткой "else" */
  const handleAddBranch = () => {
    const elseIndex = branches.findIndex(b => b.operator === 'else');
    const newBranch: ConditionBranch = {
      id: `branch_${Date.now()}`,
      label: `Ветка ${branches.filter(b => b.operator !== 'else').length + 1}`,
      operator: '==',
      value: '',
    };
    const updated = elseIndex >= 0
      ? [...branches.slice(0, elseIndex), newBranch, ...branches.slice(elseIndex)]
      : [...branches, newBranch];
    onNodeUpdate(selectedNode.id, { branches: updated });
  };

  return (
    <div className="space-y-4 p-4">
      {/* Переменная */}
      <div className="space-y-2">
        <Label>Переменная для проверки</Label>
        <Input
          value={variable}
          onChange={e => onNodeUpdate(selectedNode.id, { variable: e.target.value })}
          placeholder="{{user_name}}"
          className="font-mono"
        />
      </div>

      {/* Ветки */}
      <div className="space-y-2">
        <Label>Ветки условия</Label>
        <div className="space-y-2">
          {branches.map(branch => (
            <ConditionBranchItem
              key={branch.id}
              branch={branch}
              onChange={handleBranchChange}
              onDelete={handleBranchDelete}
            />
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full mt-2"
          onClick={handleAddBranch}
        >
          <i className="fas fa-plus mr-2 text-xs" />
          Добавить ветку
        </Button>
      </div>
    </div>
  );
}
