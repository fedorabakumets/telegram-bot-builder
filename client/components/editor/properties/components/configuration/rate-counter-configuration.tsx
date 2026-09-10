/**
 * @fileoverview Панель свойств узла rate_counter
 * @module components/editor/properties/components/configuration/rate-counter-configuration
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Node } from '@shared/schema';
import { VariableNameInput } from '../variables/variable-name-input';
import type { Variable } from '../../../inline-rich/types';

/** Пропсы конфигурации rate_counter */
interface RateCounterConfigurationProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Обновление данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Доступные переменные */
  textVariables?: Variable[];
}

/**
 * Панель свойств узла rate_counter
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function RateCounterConfiguration({
  selectedNode,
  onNodeUpdate,
  textVariables = [],
}: RateCounterConfigurationProps) {
  const data = selectedNode.data as Record<string, unknown>;

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <Label className="text-xs font-medium">Ключ счётчика</Label>
        <Input
          value={String(data.counterKey ?? '')}
          onChange={(e) => onNodeUpdate(selectedNode.id, { counterKey: e.target.value })}
          placeholder="spam_messages или {user_id}"
          className="h-8 text-xs"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">Окно (секунды)</Label>
        <Input
          value={String(data.windowSeconds ?? '60')}
          onChange={(e) => onNodeUpdate(selectedNode.id, { windowSeconds: e.target.value })}
          placeholder="60"
          className="h-8 text-xs"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">Сохранить в переменную</Label>
        <VariableNameInput
          value={String(data.saveResultTo ?? 'rate_count')}
          availableVariables={textVariables}
          onChange={(value) => onNodeUpdate(selectedNode.id, { saveResultTo: value })}
          placeholder="rate_count"
        />
      </div>
    </div>
  );
}
