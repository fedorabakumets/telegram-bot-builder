/**
 * @fileoverview Панель свойств узла триггера редактирования сообщения через юзербот
 * @module properties/components/trigger/UserbotEditTriggerConfiguration
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Node } from '@shared/schema';
import { TriggerTargetSelector } from './TriggerTargetSelector';
import { formatNodeDisplay as defaultFormatNodeDisplay } from '../../utils/node-formatters';

/** Пропсы компонента UserbotEditTriggerConfiguration */
interface UserbotEditTriggerConfigurationProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Все узлы из всех листов */
  getAllNodesFromAllSheets?: Array<{ node: Node; sheetId?: string; sheetName?: string }>;
  /** Форматирование названия узла */
  formatNodeDisplay?: (node: Node, sheetName?: string) => string;
}

/**
 * Панель свойств триггера редактирования сообщения (юзербот)
 * @param props - Пропсы компонента
 * @returns JSX элемент панели свойств
 */
export function UserbotEditTriggerConfiguration({
  selectedNode,
  onNodeUpdate,
  getAllNodesFromAllSheets = [],
  formatNodeDisplay = defaultFormatNodeDisplay,
}: UserbotEditTriggerConfigurationProps) {
  const data = selectedNode.data as any;

  return (
    <div className="space-y-4 p-4">
      {/* Информационный блок */}
      <div className="rounded-xl bg-amber-50/60 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/40 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <i className="fas fa-pen text-amber-600 dark:text-amber-400 text-sm" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
            Триггер редактирования (юзербот)
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Срабатывает при редактировании сообщения в указанном чате.
          Работает через Telethon (юзербот-аккаунт).
        </p>
      </div>

      {/* Сущность (чат/канал) */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Чат / канал (entity)</Label>
        <Input
          value={data.userbotEntity || ''}
          onChange={(e) => onNodeUpdate(selectedNode.id, { userbotEntity: e.target.value })}
          placeholder="@username, ID или {переменная}"
          className="h-8 text-sm font-mono"
        />
        <p className="text-[10px] text-muted-foreground/60">
          Юзербот должен быть участником чата.
        </p>
      </div>

      {/* Тип фильтра */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Фильтр</Label>
        <select
          value={data.filterType || 'any'}
          onChange={(e) => onNodeUpdate(selectedNode.id, { filterType: e.target.value })}
          className="h-8 text-sm w-full rounded-md border border-input bg-background px-3"
        >
          <option value="any">Любое редактирование</option>
          <option value="contains">Содержит текст</option>
          <option value="regex">Регулярное выражение</option>
        </select>
      </div>

      {/* Значение фильтра */}
      {data.filterType && data.filterType !== 'any' && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {data.filterType === 'contains' ? 'Текст для поиска' : 'Regex-паттерн'}
          </Label>
          <Input
            value={data.filterValue || ''}
            onChange={(e) => onNodeUpdate(selectedNode.id, { filterValue: e.target.value })}
            placeholder={data.filterType === 'contains' ? 'искомый текст' : '.*паттерн.*'}
            className="h-8 text-sm font-mono"
          />
        </div>
      )}

      {/* Переменные для сохранения */}
      <div className="space-y-3 rounded-lg border border-slate-200/50 dark:border-slate-700/50 p-3">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Сохранить в переменные</p>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Текст сообщения</Label>
          <Input
            value={data.saveTextTo || ''}
            onChange={(e) => onNodeUpdate(selectedNode.id, { saveTextTo: e.target.value })}
            placeholder="edit_text"
            className="h-8 text-sm font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">ID сообщения</Label>
          <Input
            value={data.saveMessageIdTo || ''}
            onChange={(e) => onNodeUpdate(selectedNode.id, { saveMessageIdTo: e.target.value })}
            placeholder="edit_msg_id"
            className="h-8 text-sm font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">ID чата (опционально)</Label>
          <Input
            value={data.saveChatIdTo || ''}
            onChange={(e) => onNodeUpdate(selectedNode.id, { saveChatIdTo: e.target.value })}
            placeholder="edit_chat_id"
            className="h-8 text-sm font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">ID отправителя (опционально)</Label>
          <Input
            value={data.saveSenderIdTo || ''}
            onChange={(e) => onNodeUpdate(selectedNode.id, { saveSenderIdTo: e.target.value })}
            placeholder="edit_sender_id"
            className="h-8 text-sm font-mono"
          />
        </div>
      </div>

      {/* Целевой узел */}
      <TriggerTargetSelector
        selectedNode={selectedNode}
        autoTransitionTo={data.autoTransitionTo || ''}
        getAllNodesFromAllSheets={getAllNodesFromAllSheets}
        onNodeUpdate={onNodeUpdate}
        formatNodeDisplay={formatNodeDisplay}
      />
    </div>
  );
}
