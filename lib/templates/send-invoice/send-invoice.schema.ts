/**
 * @fileoverview Zod-схема параметров send_invoice
 * @module templates/send-invoice/send-invoice.schema
 */

import { z } from 'zod';

/** Схема одного счёта (XTR или фиат) */
export const sendInvoiceEntrySchema = z.object({
  /** ID узла */
  nodeId: z.string(),
  /** Название товара */
  title: z.string(),
  /** Описание товара */
  description: z.string(),
  /** Цена (звёзды или минорные единицы) */
  amount: z.string(),
  /** Валюта: код или шаблон {переменная} */
  currency: z.string().default('XTR'),
  /** Источник токена провайдера */
  providerSource: z.enum(['inline', 'env']).default('inline'),
  /** Токен в ноде */
  providerToken: z.string().default(''),
  /** Env-ключ токена */
  providerTokenEnv: z.string().default('PAYMENT_PROVIDER_TOKEN'),
  /** Запросить имя */
  needName: z.boolean().default(false),
  /** Запросить email */
  needEmail: z.boolean().default(false),
  /** Запросить телефон */
  needPhone: z.boolean().default(false),
  /** URL картинки */
  photoUrl: z.string().default(''),
  /** Скрытая метка покупки */
  payload: z.string(),
  /** Переменная для суммы */
  savePaymentAmountTo: z.string().default(''),
  /** Переменная для кода покупки */
  savePaymentChargeIdTo: z.string().default(''),
  /** Переменная для имени покупателя */
  saveOrderNameTo: z.string().default(''),
  /** Переменная для email */
  saveOrderEmailTo: z.string().default(''),
  /** Переменная для телефона */
  saveOrderPhoneTo: z.string().default(''),
  /** ID узла после оплаты */
  autoTransitionTo: z.string().default(''),
  /** Тип целевого узла */
  targetNodeType: z.string().default('message'),
  /** Есть ли клавиатура у счёта */
  hasKeyboard: z.boolean().optional().default(false),
  /** Кнопки клавиатуры */
  buttons: z.array(z.any()).optional().default([]),
  /** Раскладка */
  keyboardLayout: z.any().optional(),
});

/** Схема параметров шаблона */
export const sendInvoiceParamsSchema = z.object({
  /** Массив счетов */
  sendInvoiceEntries: z.array(sendInvoiceEntrySchema),
});

export type SendInvoiceParams = z.infer<typeof sendInvoiceParamsSchema>;
