/**
 * @fileoverview Zod-схема параметров send_invoice
 * @module templates/send-invoice/send-invoice.schema
 */

import { z } from 'zod';

/** Схема одного счёта в звёздах */
export const sendInvoiceEntrySchema = z.object({
  /** ID узла */
  nodeId: z.string(),
  /** Название товара */
  title: z.string(),
  /** Описание товара */
  description: z.string(),
  /** Цена в звёздах */
  amount: z.string(),
  /** URL картинки */
  photoUrl: z.string().default(''),
  /** Скрытая метка покупки */
  payload: z.string(),
  /** Переменная для суммы */
  savePaymentAmountTo: z.string().default(''),
  /** Переменная для кода покупки */
  savePaymentChargeIdTo: z.string().default(''),
  /** ID узла после оплаты */
  autoTransitionTo: z.string().default(''),
  /** Тип целевого узла */
  targetNodeType: z.string().default('message'),
});

/** Схема параметров шаблона */
export const sendInvoiceParamsSchema = z.object({
  /** Массив счетов */
  sendInvoiceEntries: z.array(sendInvoiceEntrySchema),
});

export type SendInvoiceParams = z.infer<typeof sendInvoiceParamsSchema>;
