/**
 * @fileoverview Панель свойств ноды задержки
 * @module components/editor/properties/components/configuration/delay-configuration
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Node } from '@shared/schema';

/** Пропсы компонента конфигурации задержки */
interface DelayConfigurationProps {
  /** Выбранный узел delay */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
}

/**
 * Компонент конфигурации ноды задержки.
 * Содержит выбор режима и поле ввода секунд.
 */
export function DelayConfiguration({ selectedNode, onNodeUpdate }: DelayConfigurationProps) {
  const data = selectedNode.data as any;
  const seconds = data?.seconds || '3';
  const mode = data?.mode || 'blocking';

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <Label>Режим</Label>
        <Select value={mode} onValueChange={(val) => onNodeUpdate(selectedNode.id, { mode: val })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="blocking">⏸ Пауза (ждёт, потом переходит)</SelectItem>
            <SelectItem value="background">🚀 Фоновый таймер (переход через N сек)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Задержка (секунды)</Label>
        <Input
          value={seconds}
          onChange={(e) => onNodeUpdate(selectedNode.id, { seconds: e.target.value })}
          placeholder="3 или {cooldown_time}"
        />
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Поддерживает {'{переменные}'}. Например: {'{cooldown_time}'}
        </p>
      </div>
    </div>
  );
}
