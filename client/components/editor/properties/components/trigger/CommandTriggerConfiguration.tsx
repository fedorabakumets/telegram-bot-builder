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
import { TriggerTargetSelector } from './TriggerTargetSelector';
import { DeepLinkSection } from './DeepLinkSection';
import { formatNodeDisplay as defaultFormatNodeDisplay } from '../../utils/node-formatters';

/**
 * Пропсы компонента CommandTriggerConfiguration
 */
interface CommandTriggerConfigurationProps {
  /** Выбранный узел типа command_trigger */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Все узлы из всех листов для выбора перехода */
  getAllNodesFromAllSheets?: Array<{ node: Node; sheetId?: string; sheetName?: string }>;
  /** Форматирование названия узла в селекторе */
  formatNodeDisplay?: (node: Node, sheetName?: string) => string;
}

/**
 * Компонент настройки узла триггера команды
 *
 * Отображает поля: команда, описание для BotFather,
 * блок Deep Link (только для /start) и выбор следующего узла.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент панели настроек триггера
 */
export function CommandTriggerConfiguration({
  selectedNode,
  onNodeUpdate,
  getAllNodesFromAllSheets,
  formatNodeDisplay = defaultFormatNodeDisplay,
}: CommandTriggerConfigurationProps) {
  const isStartCommand = selectedNode.data?.command === '/start';

  /**
   * Обновляет поля Deep Link в данных узла
   * @param updates - Частичные обновления полей Deep Link
   */
  function handleDeepLinkChange(updates: Record<string, unknown>) {
    onNodeUpdate(selectedNode.id, updates);
  }

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

      {/* Deep Link — только для команды /start */}
      {isStartCommand && (
        <DeepLinkSection
          deepLinkMatchMode={selectedNode.data?.deepLinkMatchMode ?? 'exact'}
          deepLinkParam={selectedNode.data?.deepLinkParam ?? ''}
          deepLinkSaveToVar={selectedNode.data?.deepLinkSaveToVar ?? false}
          deepLinkVarName={selectedNode.data?.deepLinkVarName ?? ''}
          onChange={handleDeepLinkChange}
        />
      )}

      {/* Следующий узел — задаёт выходное соединение (жёлтая линия на холсте) */}
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
