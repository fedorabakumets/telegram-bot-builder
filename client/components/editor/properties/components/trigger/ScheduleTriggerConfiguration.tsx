/**
 * @fileoverview Панель свойств триггера расписания (Schedule Trigger)
 * @module properties/components/trigger/ScheduleTriggerConfiguration
 */

import type { Node } from '@shared/schema';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TriggerTargetSelector } from './TriggerTargetSelector';
import { formatNodeDisplay as defaultFormatNodeDisplay } from '../../utils/node-formatters';
import { ScheduleRuleEditor } from './schedule-trigger/ScheduleRuleEditor';

/** Пропсы компонента ScheduleTriggerConfiguration */
interface ScheduleTriggerConfigurationProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Все узлы текущего листа */
  nodes?: Node[];
  /** Функция обновления данных узла */
  onUpdateNode: (nodeId: string, updates: Partial<any>) => void;
  /** Все узлы из всех листов */
  getAllNodesFromAllSheets?: Array<{ node: Node; sheetId?: string; sheetName?: string }>;
  /** Форматирование названия узла */
  formatNodeDisplay?: (node: Node, sheetName?: string) => string;
}

/** Популярные часовые пояса */
const TIMEZONES = [
  'Europe/Moscow',
  'Europe/Kiev',
  'Europe/Minsk',
  'Asia/Almaty',
  'Asia/Tashkent',
  'Asia/Yekaterinburg',
  'Asia/Novosibirsk',
  'Asia/Vladivostok',
  'UTC',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'Asia/Tokyo',
];

/**
 * Панель свойств триггера расписания.
 * Содержит: инфо-блок, правила расписания, timezone, runOnStart, выбор следующего узла.
 * @param props - Пропсы компонента
 * @returns JSX элемент
 */
export function ScheduleTriggerConfiguration({
  selectedNode,
  onUpdateNode,
  getAllNodesFromAllSheets = [],
  formatNodeDisplay = defaultFormatNodeDisplay,
}: ScheduleTriggerConfigurationProps) {
  const data = selectedNode.data as any;
  const rules: any[] = data?.rules || [{ mode: 'interval', intervalMinutes: 5 }];
  const timezone: string = data?.timezone || 'Europe/Moscow';
  const runOnStart: boolean = data?.runOnStart ?? false;

  /**
   * Обновляет поле данных узла
   * @param field - Имя поля
   * @param value - Новое значение
   */
  const update = (field: string, value: any) =>
    onUpdateNode(selectedNode.id, { [field]: value });

  /** Обновляет правило по индексу */
  const updateRule = (index: number, rule: any) => {
    const updated = [...rules];
    updated[index] = rule;
    update('rules', updated);
  };

  /** Добавляет новое правило */
  const addRule = () => {
    update('rules', [...rules, { mode: 'interval', intervalMinutes: 5 }]);
  };

  /** Удаляет правило по индексу */
  const removeRule = (index: number) => {
    if (rules.length <= 1) return;
    update('rules', rules.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4 p-4">
      {/* Инфо-блок */}
      <div className="rounded-xl bg-teal-50/60 dark:bg-teal-900/20 border border-teal-200/50 dark:border-teal-700/40 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <i className="fas fa-clock text-teal-600 dark:text-teal-400 text-sm" />
          <span className="text-sm font-medium text-teal-700 dark:text-teal-300">
            Запуск по таймеру
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Запускает цепочку узлов по таймеру без участия пользователя. Поддерживает интервал, дни недели, дни месяца и cron-выражения.
        </p>
      </div>

      {/* Правила расписания */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Правила
          </Label>
          <button
            onClick={addRule}
            className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-200 font-medium"
          >
            + Добавить
          </button>
        </div>
        {rules.map((rule, index) => (
          <ScheduleRuleEditor
            key={index}
            rule={rule}
            index={index}
            canRemove={rules.length > 1}
            onChange={(r) => updateRule(index, r)}
            onRemove={() => removeRule(index)}
          />
        ))}
      </div>

      {/* Часовой пояс */}
      <div className="space-y-2">
        <Label className="text-xs text-slate-600 dark:text-slate-400">Часовой пояс</Label>
        <select
          value={timezone}
          onChange={(e) => update('timezone', e.target.value)}
          className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </div>

      {/* Запустить при старте */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={runOnStart}
          onChange={(e) => update('runOnStart', e.target.checked)}
          className="w-4 h-4 rounded border-2 border-slate-400 dark:border-slate-500 bg-slate-100 dark:bg-slate-700 text-teal-600 dark:text-teal-500 focus:ring-teal-500 dark:focus:ring-teal-400 focus:ring-2"
        />
        <span className="text-xs text-slate-600 dark:text-slate-300">
          Запустить при старте бота
        </span>
      </label>

      {/* Выбор следующего узла */}
      <TriggerTargetSelector
        selectedNode={selectedNode}
        autoTransitionTo={data?.autoTransitionTo ?? ''}
        getAllNodesFromAllSheets={getAllNodesFromAllSheets}
        onNodeUpdate={onUpdateNode}
        formatNodeDisplay={formatNodeDisplay}
      />
    </div>
  );
}
