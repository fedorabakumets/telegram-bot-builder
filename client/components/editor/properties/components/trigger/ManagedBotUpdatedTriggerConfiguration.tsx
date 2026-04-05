/**
 * @fileoverview Панель свойств триггера управляемого бота (Bot API 9.6)
 * @module properties/components/trigger/ManagedBotUpdatedTriggerConfiguration
 */

import type { Node } from '@shared/schema';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { VariableNameInput } from '../variables/variable-name-input';
import { TriggerTargetSelector } from './TriggerTargetSelector';
import { extractVariables } from '../../utils/variables-utils';
import { formatNodeDisplay as defaultFormatNodeDisplay } from '../../utils/node-formatters';
import { useMemo } from 'react';

/** Пропсы компонента ManagedBotUpdatedTriggerConfiguration */
interface ManagedBotUpdatedTriggerConfigurationProps {
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
 * Панель свойств триггера управляемого бота.
 * Содержит секции: данные бота, данные создателя, фильтр и выбор следующего узла.
 * @param {ManagedBotUpdatedTriggerConfigurationProps} props - Пропсы компонента
 * @returns {JSX.Element} Панель свойств
 */
export function ManagedBotUpdatedTriggerConfiguration({
  selectedNode,
  onNodeUpdate,
  getAllNodesFromAllSheets = [],
  formatNodeDisplay = defaultFormatNodeDisplay,
}: ManagedBotUpdatedTriggerConfigurationProps) {
  const data = selectedNode.data as any;

  /** Список переменных для подсказок */
  const allNodes = useMemo(
    () => getAllNodesFromAllSheets.map(({ node }) => node),
    [getAllNodesFromAllSheets]
  );
  const { textVariables } = useMemo(() => extractVariables(allNodes), [allNodes]);

  /**
   * Обновляет поле данных узла
   * @param field - Имя поля
   * @param value - Новое значение
   */
  const update = (field: string, value: string) =>
    onNodeUpdate(selectedNode.id, { [field]: value });

  return (
    <div className="space-y-4 p-4">
      {/* Инфо-блок */}
      <div className="rounded-xl bg-indigo-50/60 dark:bg-indigo-900/20 border border-indigo-200/50 dark:border-indigo-700/40 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <i className="fas fa-robot text-indigo-600 dark:text-indigo-400 text-sm" />
          <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
            Триггер создания бота
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Срабатывает когда пользователь создал управляемого бота. Данные доступны из сервисного сообщения <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">managed_bot_created</code> (Bot API 9.6).
        </p>
      </div>

      {/* Секция: Данные бота */}
      <div className="rounded-xl bg-indigo-50/40 dark:bg-indigo-900/10 border border-indigo-200/40 dark:border-indigo-700/30 p-4 space-y-3">
        <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">
          Данные бота
        </p>
        <div className="space-y-2">
          <Label className="text-xs text-slate-600 dark:text-slate-400">bot.id → переменная</Label>
          <VariableNameInput
            value={data.saveBotIdTo ?? 'bot_id'}
            availableVariables={textVariables as any}
            onChange={(v) => update('saveBotIdTo', v)}
            placeholder="bot_id"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-slate-600 dark:text-slate-400">bot.username → переменная</Label>
          <VariableNameInput
            value={data.saveBotUsernameTo ?? 'bot_username'}
            availableVariables={textVariables as any}
            onChange={(v) => update('saveBotUsernameTo', v)}
            placeholder="bot_username"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-slate-600 dark:text-slate-400">bot.first_name → переменная</Label>
          <VariableNameInput
            value={data.saveBotNameTo ?? 'bot_name'}
            availableVariables={textVariables as any}
            onChange={(v) => update('saveBotNameTo', v)}
            placeholder="bot_name"
          />
        </div>
      </div>

      {/* Секция: Данные создателя */}
      <div className="rounded-xl bg-slate-50/40 dark:bg-slate-900/10 border border-slate-200/40 dark:border-slate-700/30 p-4 space-y-3">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          Данные создателя
        </p>
        <div className="space-y-2">
          <Label className="text-xs text-slate-600 dark:text-slate-400">user.id → переменная</Label>
          <VariableNameInput
            value={data.saveCreatorIdTo ?? 'creator_id'}
            availableVariables={textVariables as any}
            onChange={(v) => update('saveCreatorIdTo', v)}
            placeholder="creator_id"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-slate-600 dark:text-slate-400">user.username → переменная</Label>
          <VariableNameInput
            value={data.saveCreatorUsernameTo ?? 'creator_username'}
            availableVariables={textVariables as any}
            onChange={(v) => update('saveCreatorUsernameTo', v)}
            placeholder="creator_username"
          />
        </div>
      </div>

      {/* Секция: Фильтр */}
      <div className="rounded-xl bg-amber-50/40 dark:bg-amber-900/10 border border-amber-200/40 dark:border-amber-700/30 p-4 space-y-3">
        <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
          Фильтр
        </p>
        <div className="space-y-2">
          <Label className="text-xs text-slate-600 dark:text-slate-400">
            Фильтр по user.id (опционально)
          </Label>
          <Input
            value={data.filterByUserId ?? ''}
            onChange={(e) => update('filterByUserId', e.target.value)}
            placeholder="Пусто — реагировать на всех"
            className="text-xs"
          />
          <p className="text-[10px] text-slate-400">
            Если задан — триггер сработает только для этого пользователя.
          </p>
        </div>
      </div>

      {/* Выбор следующего узла */}
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
