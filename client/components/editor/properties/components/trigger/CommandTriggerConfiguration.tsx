/**
 * @fileoverview Панель свойств узла триггера команды
 *
 * Позволяет редактировать команду, описание и флаги
 * для узла типа command_trigger в панели свойств редактора.
 * Каждый узел — одна команда. Для нескольких команд
 * используйте несколько узлов на холсте.
 *
 * Поле «Следующий узел» задаёт `autoTransitionTo` — ID узла,
 * к которому будет нарисовано жёлтое соединение на холсте.
 * @module components/editor/properties/components/trigger/CommandTriggerConfiguration
 */

import type { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

/**
 * Пропсы компонента CommandTriggerConfiguration
 */
interface CommandTriggerConfigurationProps {
  /** Выбранный узел типа command_trigger */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
}

/**
 * Компонент настройки узла триггера команды
 *
 * Отображает поля: команда, описание для BotFather,
 * флаги "показывать в меню" и "только приватные чаты".
 *
 * @param props - Пропсы компонента
 * @returns JSX-элемент панели настроек триггера
 */
export function CommandTriggerConfiguration({ selectedNode, onNodeUpdate }: CommandTriggerConfigurationProps) {
  return (
    <div className="space-y-4 p-4">
      {/* Команда */}
      <div className="space-y-2">
        <Label>Команда</Label>
        <Input
          value={selectedNode.data?.command || ''}
          onChange={e => onNodeUpdate(selectedNode.id, { command: e.target.value })}
          placeholder="/start"
          className="font-mono"
        />
      </div>

      {/* Описание */}
      <div className="space-y-2">
        <Label>Описание (для BotFather)</Label>
        <Input
          value={selectedNode.data?.description || ''}
          onChange={e => onNodeUpdate(selectedNode.id, { description: e.target.value })}
          placeholder="Описание команды"
        />
      </div>

      {/* Показывать в меню */}
      <div className="flex items-center justify-between">
        <Label>Показывать в меню</Label>
        <Switch
          checked={selectedNode.data?.showInMenu ?? true}
          onCheckedChange={v => onNodeUpdate(selectedNode.id, { showInMenu: v })}
        />
      </div>

      {/* Только приватные чаты */}
      <div className="flex items-center justify-between">
        <Label>Только приватные чаты</Label>
        <Switch
          checked={selectedNode.data?.isPrivateOnly ?? false}
          onCheckedChange={v => onNodeUpdate(selectedNode.id, { isPrivateOnly: v })}
        />
      </div>

      {/* Следующий узел — задаёт выходное соединение (жёлтая линия на холсте) */}
      <div className="space-y-2">
        <Label>Следующий узел (ID)</Label>
        <Input
          value={selectedNode.data?.autoTransitionTo || ''}
          onChange={e => onNodeUpdate(selectedNode.id, { autoTransitionTo: e.target.value })}
          placeholder="ID следующего узла"
          className="font-mono"
        />
      </div>
    </div>
  );
}
