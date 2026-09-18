/**
 * @fileoverview Параметры шаблона триггера успешной оплаты
 * @module templates/successful-payment-trigger/successful-payment-trigger.params
 */

/** Режим фильтра скрытой метки покупки */
export type SuccessfulPaymentPayloadFilter = 'all' | 'exact' | 'starts_with';

/** Параметры одного узла successful_payment_trigger */
export interface SuccessfulPaymentTriggerEntry {
  /** ID узла триггера */
  nodeId: string;
  /** ID целевого узла после срабатывания */
  targetNodeId: string;
  /** Тип целевого узла */
  targetNodeType: string;
  /** Режим фильтра метки */
  payloadFilter: SuccessfulPaymentPayloadFilter;
  /** Значение метки для exact / starts_with */
  payloadValue: string;
  /** Переменная для суммы оплаты */
  savePaymentAmountTo: string;
  /** Переменная для кода покупки */
  savePaymentChargeIdTo: string;
}

/** Параметры шаблона всех триггеров успешной оплаты */
export interface SuccessfulPaymentTriggerTemplateParams {
  /** Массив триггеров (уже отсортирован: exact → starts_with → all) */
  entries: SuccessfulPaymentTriggerEntry[];
}
