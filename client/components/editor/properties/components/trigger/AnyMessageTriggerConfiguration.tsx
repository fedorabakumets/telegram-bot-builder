/**
 * @fileoverview Панель свойств узла триггера входящего сообщения
 * @module properties/components/trigger/AnyMessageTriggerConfiguration
 */

import { Node } from '@shared/schema';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useMemo } from 'react';
import { VariableNameInput } from '../variables/variable-name-input';
import { extractVariables } from '../../utils/variables-utils';
import type { Variable } from '../../../inline-rich/types';

/** Пропсы панели свойств триггера входящего сообщения */
interface AnyMessageTriggerConfigurationProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Обновление данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
  /** Все узлы проекта */
  getAllNodesFromAllSheets?: Array<{ node: Node; sheetId?: string; sheetName?: string }>;
}

/**
 * Панель свойств триггера входящего сообщения с фильтрами чата и охраны цепочки
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function AnyMessageTriggerConfiguration({
  selectedNode,
  onNodeUpdate,
  getAllNodesFromAllSheets = [],
}: AnyMessageTriggerConfigurationProps) {
  const data = selectedNode.data as Record<string, unknown>;
  const chatTypeFilter = (data.imtChatTypeFilter as string) ?? 'any';
  const groupChatIdSource = (data.imtGroupChatIdSource as string) ?? 'manual';
  const stopOnFlag = data.imtStopOnFlag !== false;

  const update = (updates: Record<string, unknown>) =>
    onNodeUpdate(selectedNode.id, updates as Partial<Node['data']>);

  const textVariables = useMemo((): Variable[] => {
    const nodes = getAllNodesFromAllSheets.map((n) => n.node);
    const { textVariables: vars } = extractVariables(nodes);
    return vars as Variable[];
  }, [getAllNodesFromAllSheets]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-green-50/60 dark:bg-green-900/20 border border-green-200/50 dark:border-green-700/40 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <i className="fas fa-inbox text-green-600 dark:text-green-400 text-sm" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            Триггер входящего сообщения
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Срабатывает на входящие сообщения. Фильтры ограничивают тип чата и группу.
        </p>
      </div>

      <div className="space-y-2 px-1">
        <Label className="text-xs font-medium">Тип чата</Label>
        <Select
          value={chatTypeFilter}
          onValueChange={(value) => update({ imtChatTypeFilter: value })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Любой</SelectItem>
            <SelectItem value="private">Личный</SelectItem>
            <SelectItem value="group">Группа</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {chatTypeFilter === 'group' && (
        <div className="space-y-3 px-1 border rounded-lg p-3 border-violet-200/50 dark:border-violet-800/40">
          <Label className="text-xs font-medium text-violet-700 dark:text-violet-300">ID группы</Label>
          <Select
            value={groupChatIdSource}
            onValueChange={(value) => update({ imtGroupChatIdSource: value })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Вручную</SelectItem>
              <SelectItem value="variable">Из переменной</SelectItem>
            </SelectContent>
          </Select>

          {groupChatIdSource === 'manual' ? (
            <input
              value={String(data.imtGroupChatId ?? '')}
              onChange={(e) => update({ imtGroupChatId: e.target.value })}
              placeholder="2300967595"
              className="flex h-9 w-full rounded-md border px-3 py-1 text-sm"
            />
          ) : (
            <VariableNameInput
              value={String(data.groupChatVariableName ?? '')}
              availableVariables={textVariables}
              onChange={(value) => update({ groupChatVariableName: value })}
              placeholder="group_chat_id"
            />
          )}
        </div>
      )}

      <div className="flex items-center justify-between px-1">
        <div>
          <Label className="text-xs font-medium">Остановка цепочки</Label>
          <p className="text-[10px] text-muted-foreground">
            Учитывать флаг _stop_processing от узла «Стоп»
          </p>
        </div>
        <Switch
          checked={stopOnFlag}
          onCheckedChange={(checked) => update({ imtStopOnFlag: checked })}
        />
      </div>
    </div>
  );
}
