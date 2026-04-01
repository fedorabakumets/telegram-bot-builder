/**
 * @fileoverview Компонент конфигурации узла триггера сообщения в группе/топике Telegram
 * @module components/editor/properties/components/configuration/group-message-trigger-configuration
 */

import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GroupChatIdSource, GroupMessageTriggerConfigProps } from './group-message-trigger-types';
import { VariableNameInput } from '../variables/variable-name-input';
import { extractVariables } from '../../utils/variables-utils';
import type { Variable } from '../../../inline-rich/types';

/**
 * Компонент конфигурации узла group_message_trigger
 *
 * Три секции:
 * - Группа: источник ID группы (manual/variable)
 * - Маппинг топика: переменная с thread_id пользователя
 * - Результат: переменная куда положить найденный user_id
 */
export function GroupMessageTriggerConfiguration({
  selectedNode,
  onNodeUpdate,
  getAllNodesFromAllSheets = [],
}: GroupMessageTriggerConfigProps) {
  const data = selectedNode.data as any;
  const chatIdSource: GroupChatIdSource = data.groupChatIdSource ?? 'manual';

  const update = (updates: Record<string, unknown>) =>
    onNodeUpdate(selectedNode.id, updates as any);

  /** Извлекаем текстовые переменные из всех узлов проекта */
  const textVariables = useMemo((): Variable[] => {
    const nodes = getAllNodesFromAllSheets.map((n) => n.node);
    const { textVariables: vars } = extractVariables(nodes);
    return vars as Variable[];
  }, [getAllNodesFromAllSheets]);

  return (
    <div className="space-y-6">
      {/* Секция: Группа */}
      <div className="bg-gradient-to-br from-violet-50/50 to-purple-50/30 dark:from-violet-950/20 dark:to-purple-950/10 border border-violet-200/30 dark:border-violet-800/30 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
            <i className="fas fa-comments text-violet-600 dark:text-violet-400 text-xs"></i>
          </div>
          <Label className="text-sm font-semibold text-violet-900 dark:text-violet-100">Группа</Label>
        </div>

        <div className="space-y-3">
          <Select
            value={chatIdSource}
            onValueChange={(value) => update({ groupChatIdSource: value as GroupChatIdSource })}
          >
            <SelectTrigger className="bg-card/70 border border-violet-200/50 dark:border-violet-800/50">
              <SelectValue placeholder="Источник ID группы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Вручную</SelectItem>
              <SelectItem value="variable">Из переменной</SelectItem>
            </SelectContent>
          </Select>

          {chatIdSource === 'manual' && (
            <div className="space-y-1">
              <Label className="text-xs font-medium text-violet-700 dark:text-violet-300">ID группы</Label>
              <input
                value={data.groupChatId ?? ''}
                onChange={(e) => update({ groupChatId: e.target.value })}
                placeholder="2300967595"
                className="flex h-9 w-full rounded-md border border-violet-200/50 dark:border-violet-800/50 bg-white/60 dark:bg-slate-950/60 px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          )}

          {chatIdSource === 'variable' && (
            <div className="space-y-1">
              <Label className="text-xs font-medium text-violet-700 dark:text-violet-300">Имя переменной</Label>
              <VariableNameInput
                value={data.groupChatVariableName ?? ''}
                availableVariables={textVariables}
                onChange={(value) => update({ groupChatVariableName: value })}
                placeholder="group_chat_id"
              />
            </div>
          )}
        </div>
      </div>

      {/* Секция: Маппинг топика */}
      <div className="bg-gradient-to-br from-purple-50/50 to-fuchsia-50/30 dark:from-purple-950/20 dark:to-fuchsia-950/10 border border-purple-200/30 dark:border-purple-800/30 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
            <i className="fas fa-link text-purple-600 dark:text-purple-400 text-xs"></i>
          </div>
          <Label className="text-sm font-semibold text-purple-900 dark:text-purple-100">Маппинг топика</Label>
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-medium text-purple-700 dark:text-purple-300">Переменная с thread_id пользователя</Label>
          <VariableNameInput
            value={data.threadIdVariable ?? ''}
            availableVariables={textVariables}
            onChange={(value) => update({ threadIdVariable: value })}
            placeholder="support_thread_id"
          />
          <div className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">
            По этой переменной ищем пользователя в базе
          </div>
        </div>
      </div>

      {/* Секция: Результат */}
      <div className="bg-gradient-to-br from-slate-50/50 to-slate-100/30 dark:from-slate-950/20 dark:to-slate-900/10 border border-slate-200/30 dark:border-slate-800/30 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center">
            <i className="fas fa-user-check text-slate-600 dark:text-slate-400 text-xs"></i>
          </div>
          <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Результат</Label>
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Переменная для найденного user_id</Label>
          <VariableNameInput
            value={data.resolvedUserIdVariable ?? ''}
            availableVariables={textVariables}
            onChange={(value) => update({ resolvedUserIdVariable: value })}
            placeholder="resolved_user_id"
     
          />
          <div className="text-xs text-slate-600/70 dark:text-slate-400/70 mt-1">
            Найденный user_id будет доступен в следующих узлах
          </div>
        </div>
      </div>
    </div>
  );
}
