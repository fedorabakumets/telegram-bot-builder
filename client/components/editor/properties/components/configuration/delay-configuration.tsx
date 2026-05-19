/**
 * @fileoverview Панель свойств ноды задержки
 * @module components/editor/properties/components/configuration/delay-configuration
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Node } from '@shared/schema';
import { VariableSelector } from '../variables/variable-selector';
import type { Variable } from '../../../inline-rich/types';

/** Пропсы компонента конфигурации задержки */
interface DelayConfigurationProps {
  /** Выбранный узел delay */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Доступные переменные */
  textVariables?: Variable[];
}

/**
 * Компонент конфигурации ноды задержки.
 * Содержит выбор режима, значение задержки, единицы времени и селектор переменных.
 */
export function DelayConfiguration({ selectedNode, onNodeUpdate, textVariables = [] }: DelayConfigurationProps) {
  const data = selectedNode.data as any;
  const seconds = data?.seconds || '3';
  const unit = data?.unit || 'seconds';
  const mode = data?.mode || 'blocking';

  /** Вставка переменной в поле значения */
  const handleVariableInsert = (varName: string) => {
    onNodeUpdate(selectedNode.id, { seconds: `{${varName}}` });
  };

  return (
    <div className="space-y-4 p-4">
      {/* Режим */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Режим</Label>
        <Select value={mode} onValueChange={(val) => onNodeUpdate(selectedNode.id, { mode: val })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="blocking">⏸ Пауза</SelectItem>
            <SelectItem value="background">🚀 Фоновый таймер</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-[10px] text-gray-400">
          {mode === 'blocking' ? 'Ждёт указанное время, потом переходит дальше' : 'Запускает переход через N времени, цепочка завершается сразу'}
        </p>
      </div>

      {/* Значение + единицы */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Задержка</Label>
        <div className="flex gap-2">
          <Input
            value={seconds}
            onChange={(e) => onNodeUpdate(selectedNode.id, { seconds: e.target.value })}
            placeholder="3"
            className="h-8 text-xs flex-1"
          />
          <Select value={unit} onValueChange={(val) => onNodeUpdate(selectedNode.id, { unit: val })}>
            <SelectTrigger className="h-8 text-xs w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="seconds">Секунды</SelectItem>
              <SelectItem value="minutes">Минуты</SelectItem>
              <SelectItem value="hours">Часы</SelectItem>
              <SelectItem value="days">Дни</SelectItem>
              <SelectItem value="weeks">Недели</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Селектор переменных */}
      {textVariables.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-medium">Вставить переменную</Label>
          <VariableSelector
            availableVariables={textVariables}
            onSelect={handleVariableInsert}
          />
        </div>
      )}
    </div>
  );
}
