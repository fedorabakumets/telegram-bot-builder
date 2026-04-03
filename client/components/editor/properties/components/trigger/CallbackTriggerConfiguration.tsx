/**
 * @fileoverview Панель свойств узла триггера нажатия inline-кнопки (callback_trigger)
 *
 * Позволяет настроить данные callback и тип совпадения,
 * а также выбрать следующий узел для перехода.
 *
 * @module components/editor/properties/components/trigger/CallbackTriggerConfiguration
 */

import type { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TriggerTargetSelector } from './TriggerTargetSelector';
import { formatNodeDisplay as defaultFormatNodeDisplay } from '../../utils/node-formatters';

/**
 * Пропсы компонента CallbackTriggerConfiguration
 */
interface CallbackTriggerConfigurationProps {
  /** Выбранный узел типа callback_trigger */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Все узлы из всех листов для выбора перехода */
  getAllNodesFromAllSheets?: Array<{ node: Node; sheetId?: string; sheetName?: string }>;
  /** Форматирование названия узла в селекторе */
  formatNodeDisplay?: (node: Node, sheetName?: string) => string;
}

/**
 * Компонент настройки узла триггера нажатия inline-кнопки
 *
 * Отображает поля: callback_data и тип совпадения (exact / startswith),
 * а также селектор следующего узла.
 *
 * @param props - Пропсы компонента
 * @returns JSX-элемент панели настроек триггера
 */
export function CallbackTriggerConfiguration({
  selectedNode,
  onNodeUpdate,
  getAllNodesFromAllSheets,
  formatNodeDisplay = defaultFormatNodeDisplay,
}: CallbackTriggerConfigurationProps) {
  /** Текущее значение callback_data */
  const callbackData: string = (selectedNode.data as any)?.callbackData ?? '';

  /** Текущий тип совпадения */
  const matchType: string = (selectedNode.data as any)?.matchType ?? 'exact';

  return (
    <div className="space-y-4 p-4">
      {/* Поле callback_data */}
      <div className="space-y-2">
        <Label>callback_data</Label>
        <Input
          value={callbackData}
          onChange={e => onNodeUpdate(selectedNode.id, { callbackData: e.target.value })}
          placeholder="my_callback"
          className="font-mono"
        />
      </div>

      {/* Тип совпадения */}
      <div className="space-y-2">
        <Label>Тип совпадения</Label>
        <Select
          value={matchType}
          onValueChange={value => onNodeUpdate(selectedNode.id, { matchType: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="exact">Точное совпадение</SelectItem>
            <SelectItem value="startswith">Начинается с</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Следующий узел */}
      <TriggerTargetSelector
        selectedNode={selectedNode}
        autoTransitionTo={selectedNode.data?.autoTransitionTo || ''}
        getAllNodesFromAllSheets={getAllNodesFromAllSheets}
        onNodeUpdate={onNodeUpdate}
        formatNodeDisplay={formatNodeDisplay}
      />
    </div>
  );
}
