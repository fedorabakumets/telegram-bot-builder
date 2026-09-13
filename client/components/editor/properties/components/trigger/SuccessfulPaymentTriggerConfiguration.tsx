/**
 * @fileoverview Панель свойств триггера «Успешная оплата»
 * @module properties/components/trigger/SuccessfulPaymentTriggerConfiguration
 */

import type { Node } from '@shared/schema';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VariableNameInput } from '../variables/variable-name-input';
import { TriggerTargetSelector } from './TriggerTargetSelector';
import { extractVariables } from '../../utils/variables-utils';
import { formatNodeDisplay as defaultFormatNodeDisplay } from '../../utils/node-formatters';
import { useMemo } from 'react';

/** Пропсы панели триггера успешной оплаты */
interface SuccessfulPaymentTriggerConfigurationProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Обновление данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Узлы всех листов */
  getAllNodesFromAllSheets?: Array<{ node: Node; sheetId?: string; sheetName?: string }>;
  /** Подпись узла */
  formatNodeDisplay?: (node: Node, sheetName?: string) => string;
}

/**
 * Настройки фильтра метки, сохранения суммы/кода и перехода
 * @param props - Пропсы
 * @returns JSX панель
 */
export function SuccessfulPaymentTriggerConfiguration({
  selectedNode,
  onNodeUpdate,
  getAllNodesFromAllSheets = [],
  formatNodeDisplay = defaultFormatNodeDisplay,
}: SuccessfulPaymentTriggerConfigurationProps) {
  const data = selectedNode.data as any;
  const filter: string = data.payloadFilter || 'all';

  const allNodes = useMemo(
    () => getAllNodesFromAllSheets.map(({ node }) => node),
    [getAllNodesFromAllSheets],
  );
  const { textVariables } = useMemo(() => extractVariables(allNodes), [allNodes]);

  /**
   * Обновляет одно поле data
   * @param field - Имя поля
   * @param value - Значение
   */
  const update = (field: string, value: string) =>
    onNodeUpdate(selectedNode.id, { [field]: value });

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-xl bg-yellow-50/60 dark:bg-yellow-900/20 border border-yellow-200/50 dark:border-yellow-700/40 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <i className="fas fa-check-circle text-yellow-600 dark:text-yellow-400 text-sm" />
          <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
            Успешная оплата
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Срабатывает, когда пришла оплата звёздами, а счёт не из текущей цепочки
          (ссылка, другой поток). Если счёт из этой сессии — сработает выход у узла «Выставить счёт».
        </p>
      </div>

      <div className="rounded-xl bg-amber-50/40 dark:bg-amber-900/10 border border-amber-200/40 dark:border-amber-700/30 p-4 space-y-3">
        <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
          Фильтр метки покупки
        </p>
        <div className="space-y-2">
          <Label className="text-xs text-slate-600 dark:text-slate-400">Режим</Label>
          <Select
            value={filter}
            onValueChange={(v) => update('payloadFilter', v)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все оплаты</SelectItem>
              <SelectItem value="exact">Точное совпадение</SelectItem>
              <SelectItem value="starts_with">Начинается с…</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(filter === 'exact' || filter === 'starts_with') && (
          <div className="space-y-2">
            <Label className="text-xs text-slate-600 dark:text-slate-400">Метка (payload)</Label>
            <Input
              value={data.payloadValue ?? ''}
              onChange={(e) => update('payloadValue', e.target.value)}
              placeholder={filter === 'exact' ? 'donate_1' : 'donate_'}
              className="h-8 text-xs font-mono"
            />
          </div>
        )}
      </div>

      <div className="rounded-xl bg-yellow-50/40 dark:bg-yellow-900/10 border border-yellow-200/40 dark:border-yellow-700/30 p-4 space-y-3">
        <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-300 uppercase tracking-wide">
          Сохранить
        </p>
        <div className="space-y-2">
          <Label className="text-xs text-slate-600 dark:text-slate-400">Сумма → переменная</Label>
          <VariableNameInput
            value={data.savePaymentAmountTo ?? ''}
            availableVariables={textVariables as any}
            onChange={(v) => update('savePaymentAmountTo', v)}
            placeholder="payment_amount"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-slate-600 dark:text-slate-400">Код покупки → переменная</Label>
          <VariableNameInput
            value={data.savePaymentChargeIdTo ?? ''}
            availableVariables={textVariables as any}
            onChange={(v) => update('savePaymentChargeIdTo', v)}
            placeholder="payment_charge_id"
          />
        </div>
      </div>

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
