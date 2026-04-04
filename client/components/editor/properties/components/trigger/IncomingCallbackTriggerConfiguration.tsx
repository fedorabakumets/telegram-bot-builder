/**
 * @fileoverview Панель свойств узла триггера входящего callback_query
 *
 * Минималистичная панель с информацией о триггере и выбором следующего узла.
 * @module properties/components/trigger/IncomingCallbackTriggerConfiguration
 */

import type { Node } from '@shared/schema';
import { TriggerTargetSelector } from './TriggerTargetSelector';
import { formatNodeDisplay as defaultFormatNodeDisplay } from '../../utils/node-formatters';

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
  return (
    <div className="space-y-4 p-4">
      <div className="rounded-xl bg-orange-50/60 dark:bg-orange-900/20 border border-orange-200/50 dark:border-orange-700/40 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <i className="fas fa-hand-pointer text-orange-600 dark:text-orange-400 text-sm" />
          <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
            Триггер нажатия кнопки
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Срабатывает на каждое нажатие инлайн-кнопки пользователем.
          Работает параллельно с основным потоком — не прерывает его.
          Доступны переменные <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{'{callback_data}'}</code> и <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{'{button_text}'}</code>.
        </p>
      </div>

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
