/**
 * @fileoverview Панель свойств узла триггера команды
 *
 * Позволяет редактировать команду, описание, синонимы и флаги
 * для узла типа command_trigger в панели свойств редактора.
 * @module components/editor/properties/components/trigger/CommandTriggerConfiguration
 */

import { useState } from 'react';
import type { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';

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
 * флаги "показывать в меню" и "только приватные чаты",
 * а также редактор синонимов с добавлением по Enter.
 *
 * @param props - Пропсы компонента
 * @returns JSX-элемент панели настроек триггера
 */
export function CommandTriggerConfiguration({ selectedNode, onNodeUpdate }: CommandTriggerConfigurationProps) {
  /** Текущее значение поля ввода нового синонима */
  const [newSynonym, setNewSynonym] = useState('');

  /** Список синонимов из данных узла */
  const synonyms: string[] = (selectedNode.data?.synonyms as string[]) || [];

  const addSynonym = () => {
    const trimmed = newSynonym.trim().toLowerCase();
    if (!trimmed || synonyms.includes(trimmed)) return;
    onNodeUpdate(selectedNode.id, { synonyms: [...synonyms, trimmed] });
    setNewSynonym('');
  };

  const removeSynonym = (s: string) => {
    onNodeUpdate(selectedNode.id, { synonyms: synonyms.filter(x => x !== s) });
  };

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

      {/* Синонимы */}
      <div className="space-y-2">
        <Label>Синонимы</Label>
        <div className="flex gap-2">
          <Input
            value={newSynonym}
            onChange={e => setNewSynonym(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addSynonym()}
            placeholder="начать, старт, go..."
          />
          <Button size="sm" variant="outline" onClick={addSynonym}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {synonyms.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {synonyms.map(s => (
              <Badge key={s} variant="secondary" className="gap-1">
                {s}
                <button onClick={() => removeSynonym(s)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
