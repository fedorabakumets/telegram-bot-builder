/**
 * @fileoverview Панель свойств триггера входа/выхода участника группы
 * @module properties/components/trigger/MemberTriggerConfiguration
 */

import type { Node } from '@shared/schema';
import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { VariableNameInput } from '../variables/variable-name-input';
import { TriggerTargetSelector } from './TriggerTargetSelector';
import { extractVariables } from '../../utils/variables-utils';
import { formatNodeDisplay as defaultFormatNodeDisplay } from '../../utils/node-formatters';

/** Тип события участника */
type MemberEventType = 'join' | 'leave' | 'both';

/** Источник ID группы */
type GroupChatIdSource = 'manual' | 'variable';

/** Пропсы компонента MemberTriggerConfiguration */
interface MemberTriggerConfigurationProps {
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
 * Панель свойств триггера участника группы.
 * @param props - Пропсы компонента
 * @returns JSX элемент
 */
export function MemberTriggerConfiguration({
  selectedNode,
  onNodeUpdate,
  getAllNodesFromAllSheets = [],
  formatNodeDisplay = defaultFormatNodeDisplay,
}: MemberTriggerConfigurationProps) {
  const data = selectedNode.data as any;
  const memberEventType: MemberEventType = data.memberEventType ?? 'join';
  const chatIdSource: GroupChatIdSource = data.groupChatIdSource ?? 'manual';

  const allNodes = useMemo(
    () => getAllNodesFromAllSheets.map(({ node }) => node),
    [getAllNodesFromAllSheets],
  );
  const { textVariables } = useMemo(() => extractVariables(allNodes), [allNodes]);

  /**
   * Обновляет поле данных узла
   * @param field - Имя поля
   * @param value - Новое значение
   */
  const update = (field: string, value: string) =>
    onNodeUpdate(selectedNode.id, { [field]: value });

  const showJoinVars = memberEventType === 'join' || memberEventType === 'both';
  const showLeaveVars = memberEventType === 'leave' || memberEventType === 'both';

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-xl bg-emerald-50/60 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-700/40 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <i className="fas fa-user-plus text-emerald-600 dark:text-emerald-400 text-sm" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            Участник вошёл или вышел
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Срабатывает на сервисные сообщения <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">new_chat_members</code> и <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">left_chat_member</code> в группах и супергруппах.
        </p>
      </div>

      <div className="rounded-xl bg-emerald-50/40 dark:bg-emerald-900/10 border border-emerald-200/40 dark:border-emerald-700/30 p-4 space-y-3">
        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
          Событие
        </p>
        <Select
          value={memberEventType}
          onValueChange={(value) => update('memberEventType', value)}
        >
          <SelectTrigger className="text-xs">
            <SelectValue placeholder="Тип события" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="join">Вход участника</SelectItem>
            <SelectItem value="leave">Выход участника</SelectItem>
            <SelectItem value="both">Вход и выход</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl bg-violet-50/40 dark:bg-violet-900/10 border border-violet-200/40 dark:border-violet-700/30 p-4 space-y-3">
        <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wide">
          Фильтр группы (опционально)
        </p>
        <Select
          value={chatIdSource}
          onValueChange={(value) => update('groupChatIdSource', value)}
        >
          <SelectTrigger className="text-xs">
            <SelectValue placeholder="Источник ID группы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Вручную</SelectItem>
            <SelectItem value="variable">Из переменной</SelectItem>
          </SelectContent>
        </Select>

        {chatIdSource === 'manual' && (
          <div className="space-y-2">
            <Label className="text-xs text-slate-600 dark:text-slate-400">ID группы</Label>
            <Input
              value={data.groupChatId ?? ''}
              onChange={(e) => update('groupChatId', e.target.value)}
              placeholder="2300967595"
              className="text-xs"
            />
            <p className="text-[10px] text-slate-400">Пусто — реагировать на все группы</p>
          </div>
        )}

        {chatIdSource === 'variable' && (
          <div className="space-y-2">
            <Label className="text-xs text-slate-600 dark:text-slate-400">Имя переменной</Label>
            <VariableNameInput
              value={data.groupChatVariableName ?? ''}
              availableVariables={textVariables as any}
              onChange={(v) => update('groupChatVariableName', v)}
              placeholder="group_chat_id"
            />
          </div>
        )}
      </div>

      {showJoinVars && (
        <div className="rounded-xl bg-slate-50/40 dark:bg-slate-900/10 border border-slate-200/40 dark:border-slate-700/30 p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Данные вошедшего участника
          </p>
          <div className="space-y-2">
            <Label className="text-xs text-slate-600 dark:text-slate-400">user.id → переменная</Label>
            <VariableNameInput
              value={data.saveJoinedUserIdTo ?? 'joined_user_id'}
              availableVariables={textVariables as any}
              onChange={(v) => update('saveJoinedUserIdTo', v)}
              placeholder="joined_user_id"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-slate-600 dark:text-slate-400">username → переменная</Label>
            <VariableNameInput
              value={data.saveJoinedUsernameTo ?? 'joined_username'}
              availableVariables={textVariables as any}
              onChange={(v) => update('saveJoinedUsernameTo', v)}
              placeholder="joined_username"
            />
          </div>
        </div>
      )}

      {showLeaveVars && (
        <div className="rounded-xl bg-amber-50/40 dark:bg-amber-900/10 border border-amber-200/40 dark:border-amber-700/30 p-4 space-y-3">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
            Данные вышедшего участника
          </p>
          <div className="space-y-2">
            <Label className="text-xs text-slate-600 dark:text-slate-400">user.id → переменная</Label>
            <VariableNameInput
              value={data.saveLeftUserIdTo ?? 'left_user_id'}
              availableVariables={textVariables as any}
              onChange={(v) => update('saveLeftUserIdTo', v)}
              placeholder="left_user_id"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-slate-600 dark:text-slate-400">username → переменная</Label>
            <VariableNameInput
              value={data.saveLeftUsernameTo ?? 'left_username'}
              availableVariables={textVariables as any}
              onChange={(v) => update('saveLeftUsernameTo', v)}
              placeholder="left_username"
            />
          </div>
        </div>
      )}

      <TriggerTargetSelector
        selectedNode={selectedNode}
        autoTransitionTo={data.autoTransitionTo ?? ''}
        getAllNodesFromAllSheets={getAllNodesFromAllSheets}
        onNodeUpdate={onNodeUpdate}
        formatNodeDisplay={formatNodeDisplay}
      />
    </div>
  );
}
