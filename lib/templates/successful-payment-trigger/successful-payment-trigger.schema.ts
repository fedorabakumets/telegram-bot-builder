/**
 * @fileoverview Zod-схема параметров триггера успешной оплаты
 * @module templates/successful-payment-trigger/successful-payment-trigger.schema
 */

import { z } from 'zod';

/** Схема одного триггера успешной оплаты */
const successfulPaymentTriggerEntrySchema = z.object({
  /** ID узла триггера */
  nodeId: z.string(),
  /** ID целевого узла */
  targetNodeId: z.string(),
  /** Тип целевого узла */
  targetNodeType: z.string(),
  /** Режим фильтра метки */
  payloadFilter: z.enum(['all', 'exact', 'starts_with']),
  /** Значение метки */
  payloadValue: z.string(),
  /** Переменная суммы */
  savePaymentAmountTo: z.string(),
  /** Переменная кода покупки */
  savePaymentChargeIdTo: z.string(),
});

/** Схема параметров шаблона */
export const successfulPaymentTriggerParamsSchema = z.object({
  /** Массив триггеров */
  entries: z.array(successfulPaymentTriggerEntrySchema),
});

export type SuccessfulPaymentTriggerParams = z.infer<
  typeof successfulPaymentTriggerParamsSchema
>;
