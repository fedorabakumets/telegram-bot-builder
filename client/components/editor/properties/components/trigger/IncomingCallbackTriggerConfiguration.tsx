/**
 * @fileoverview Панель свойств узла триггера входящего callback_query
 *
 * Позволяет настроить фильтрацию по паттерну callback_data и выбрать следующий узел.
 * @module properties/components/trigger/IncomingCallbackTriggerConfiguration
 */

import type { Node } from '@shared/schema';
import { TriggerTargetSelector } from './TriggerTargetSelector';
import { formatNodeDisplay as defaultFormatNodeDisplay } from '../../utils/node-formatters';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/** Пропсы компонента IncomingCallbackTriggerConfiguration */
interface IncomingCallbackTriggerConfigurationProps {
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
 * Панель свойств триггера входящего callback_query
 * @param props - Пропсы компонента
 * @returns JSX элемент панели свойств
 */
export function IncomingCallbackTriggerConfiguration({
  selectedNode,
  onNodeUpdate,
  getAllNodesFromAllSheets = [],
  formatNodeDisplay = defaultFormatNodeDisplay,
}: IncomingCallbackTriggerConfigurationProps) {
  const data = selectedNode.data as any;
  const callbackPattern: string = data?.callbackPattern ?? '';
  const callbackMatchType: string = data?.callbackMatchType ?? 'startsWith';

  /**
   * Обновляет поле данных узла
   * @param field - Имя поля
   * @param value - Новое значение
   */
  const update = (field: string, value: string) => {
    onNodeUpdate(selectedNode.id, { [field]: value });
  };

  return (
    <div className="space-y-4 p-4">
      {/* Информационный блок */}
      <div className="rounded-xl bg-orange-50/60 dark:bg-orange-900/20 border border-orange-200/50 dark:border-orange-700/40 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <i className="fas fa-hand-pointer text-orange-600 dark:text-orange-400 text-sm" />
          <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
            Триггер inline-кнопки
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Перехватывает нажатия инлайн-кнопок по паттерну.
          Доступны переменные{' '}
          <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{'{callback_data}'}</code>{' '}
          и{' '}
          <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{'{button_text}'}</code>.
        </p>
      </div>

      {/* Фильтрация по паттерну */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <i className="fas fa-filter text-slate-400 text-xs" />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
            Фильтр callback_data
          </span>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Тип сопоставления</label>
          <Select
            value={callbackMatchType}
            onValueChange={(v) => update('callbackMatchType', v)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="startsWith">Начинается с</SelectItem>
              <SelectItem value="equals">Равно</SelectItem>
              <SelectItem value="contains">Содержит</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Паттерн{' '}
            <span className="text-slate-400 font-normal">(пусто = любая кнопка)</span>
          </label>
          <Input
            value={callbackPattern}
            onChange={(e) => update('callbackPattern', e.target.value)}
            placeholder="project_"
            className="h-8 text-xs font-mono"
          />
        </div>

        {/* Превью результата */}
        {callbackPattern && (
          <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 px-3 py-2 text-[11px] text-slate-500 dark:text-slate-400">
            Сработает если callback_data{' '}
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {callbackMatchType === 'startsWith' && 'начинается с'}
              {callbackMatchType === 'equals' && 'равно'}
              {callbackMatchType === 'contains' && 'содержит'}
            </span>{' '}
            <code className="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-1 rounded font-mono">
              {callbackPattern}
            </code>
          </div>
        )}

        {!callbackPattern && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-400">
            ⚠️ Без паттерна триггер срабатывает на <strong>любое</strong> нажатие кнопки
          </div>
        )}
      </div>

      {/* Следующий узел */}
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
