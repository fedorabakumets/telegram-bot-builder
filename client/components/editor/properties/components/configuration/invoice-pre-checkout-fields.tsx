/**
 * @fileoverview Свёрнутый блок «Проверка перед оплатой» для счёта и ссылки на счёт
 * @module components/editor/properties/components/configuration/invoice-pre-checkout-fields
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PRE_CHECKOUT_OPERATORS } from '@lib/templates/send-invoice/send-invoice.params';
import type { Variable } from '../../../inline-rich/types';
import { VariableNameInput } from '../variables/variable-name-input';
import { PRE_CHECKOUT_NO_VALUE, PRE_CHECKOUT_OPERATOR_LABELS } from './invoice-pre-checkout-operators';

/** Пропсы блока проверки перед списанием */
interface InvoicePreCheckoutFieldsProps {
  /** ID узла счёта или ссылки */
  nodeId: string;
  /** Data узла */
  data: any;
  /** Обновление data */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Переменные для выбора */
  textVariables?: Variable[];
}

/**
 * Свёрнутая проверка pre_checkout: по умолчанию счёт всегда подтверждается
 * @param props - Свойства
 * @returns JSX элемент
 */
export function InvoicePreCheckoutFields({
  nodeId,
  data,
  onNodeUpdate,
  textVariables = [],
}: InvoicePreCheckoutFieldsProps) {
  const mode = data?.preCheckoutMode === 'condition' ? 'condition' : 'always';
  const operator = String(data?.preCheckoutOperator || 'filled');
  const showValue = mode === 'condition' && !PRE_CHECKOUT_NO_VALUE.has(operator);
  const isBetween = operator === 'between';

  /**
   * Пишет одно поле проверки
   * @param patch - Частичное обновление data
   */
  const update = (patch: Record<string, string>) => onNodeUpdate(nodeId, patch);

  return (
    <details className="rounded-lg border border-yellow-200/50 dark:border-yellow-800/40 bg-yellow-50/30 dark:bg-yellow-950/10">
      <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold text-yellow-800 dark:text-yellow-200">
        Проверка перед оплатой
      </summary>
      <div className="space-y-3 px-3 pb-3">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Ответ Телеграму сразу, без ожидания ввода (лимит 10 секунд).
          «Всегда разрешать» — как раньше, деньги списываются.
        </p>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Режим</Label>
          <Select value={mode} onValueChange={(value) => update({ preCheckoutMode: value })}>
            <SelectTrigger className="text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="always">Всегда разрешать</SelectItem>
              <SelectItem value="condition">По условию</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {mode === 'condition' && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Переменная</Label>
              <VariableNameInput
                value={data?.preCheckoutVariable || ''}
                availableVariables={textVariables}
                onChange={(value) => update({ preCheckoutVariable: value })}
                placeholder="can_pay"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Условие</Label>
              <Select value={operator} onValueChange={(value) => update({ preCheckoutOperator: value })}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-48 overflow-y-auto">
                  {PRE_CHECKOUT_OPERATORS.map((op) => (
                    <SelectItem key={op} value={op}>
                      {PRE_CHECKOUT_OPERATOR_LABELS[op] || op}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {showValue && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{isBetween ? 'От' : 'Значение'}</Label>
                <Input
                  value={data?.preCheckoutValue || ''}
                  onChange={(e) => update({ preCheckoutValue: e.target.value })}
                  placeholder={isBetween ? '1' : 'yes'}
                  className="h-8 text-xs"
                />
              </div>
            )}
            {isBetween && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">До</Label>
                <Input
                  value={data?.preCheckoutValue2 || ''}
                  onChange={(e) => update({ preCheckoutValue2: e.target.value })}
                  placeholder="10"
                  className="h-8 text-xs"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Текст отказа</Label>
              <Textarea
                value={data?.preCheckoutErrorMessage || ''}
                onChange={(e) => update({ preCheckoutErrorMessage: e.target.value })}
                placeholder="Оплата сейчас недоступна"
                className="text-xs min-h-[60px]"
              />
              <p className="text-[10px] text-gray-400">
                Если условие ложно. Можно {'{переменные}'}. Пусто — короткий запасной текст. До 200 знаков.
              </p>
            </div>
          </>
        )}
      </div>
    </details>
  );
}
