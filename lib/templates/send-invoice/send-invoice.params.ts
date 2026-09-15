/**
 * @fileoverview Параметры шаблона send_invoice / create_invoice_link
 * @module templates/send-invoice/send-invoice.params
 */

import type { InvoiceCurrencyCode } from '@shared/invoice-currencies';

export type { InvoiceCurrencyCode } from '@shared/invoice-currencies';

/** Источник токена провайдера */
export type InvoiceProviderSource = 'inline' | 'env';

/** Параметры одного узла send_invoice */
export interface SendInvoiceEntry {
  /** ID узла */
  nodeId: string;
  /** Название товара */
  title: string;
  /** Описание товара */
  description: string;
  /** Цена (звёзды или минорные единицы; допускает {переменные}) */
  amount: string;
  /** Валюта счёта (код или {переменная}) */
  currency: string;
  /** Источник provider_token (игнор при XTR) */
  providerSource: InvoiceProviderSource;
  /** Токен в ноде при inline */
  providerToken: string;
  /** Имя env-ключа при env */
  providerTokenEnv: string;
  /** Запросить имя (need_name), только фиат */
  needName: boolean;
  /** Запросить email (need_email) */
  needEmail: boolean;
  /** Запросить телефон (need_phone_number) */
  needPhone: boolean;
  /** URL картинки (пусто если нет) */
  photoUrl: string;
  /** Скрытая метка покупки (уже разрешённая: payload или nodeId) */
  payload: string;
  /** Переменная для суммы оплаты */
  savePaymentAmountTo: string;
  /** Переменная для кода покупки */
  savePaymentChargeIdTo: string;
  /** Переменная для order_info.name */
  saveOrderNameTo: string;
  /** Переменная для order_info.email */
  saveOrderEmailTo: string;
  /** Переменная для order_info.phone_number */
  saveOrderPhoneTo: string;
  /** ID узла после оплаты */
  autoTransitionTo: string;
  /** Тип целевого узла */
  targetNodeType: string;
  /** Есть ли привязанная клавиатура с кнопками */
  hasKeyboard: boolean;
  /** Кнопки (после normalize; pay уже первая) */
  buttons: unknown[];
  /** Раскладка клавиатуры */
  keyboardLayout?: unknown;
}

/** Параметры одного узла create_invoice_link */
export interface CreateInvoiceLinkEntry {
  /** ID узла */
  nodeId: string;
  /** Название товара */
  title: string;
  /** Описание товара */
  description: string;
  /** Цена (звёзды или минорные единицы) */
  amount: string;
  /** Валюта счёта (код или {переменная}) */
  currency: string;
  /** Источник provider_token (игнор при XTR) */
  providerSource: InvoiceProviderSource;
  /** Токен в ноде при inline */
  providerToken: string;
  /** Имя env-ключа при env */
  providerTokenEnv: string;
  /** Запросить имя (need_name), только фиат */
  needName: boolean;
  /** Запросить email (need_email) */
  needEmail: boolean;
  /** Запросить телефон (need_phone_number) */
  needPhone: boolean;
  /** URL картинки */
  photoUrl: string;
  /** Скрытая метка покупки */
  payload: string;
  /** Переменная для URL ссылки */
  saveInvoiceLinkTo: string;
  /** Переменная для суммы после оплаты */
  savePaymentAmountTo: string;
  /** Переменная для кода покупки после оплаты */
  savePaymentChargeIdTo: string;
  /** Переменная для order_info.name */
  saveOrderNameTo: string;
  /** Переменная для order_info.email */
  saveOrderEmailTo: string;
  /** Переменная для order_info.phone_number */
  saveOrderPhoneTo: string;
  /** Сразу после создания ссылки */
  autoTransitionTo: string;
  /** После оплаты по ссылке */
  afterPaymentTo: string;
  /** Подписка на 30 дней (только XTR) */
  subscription: boolean;
}

/** Параметры шаблона всех счетов */
export interface SendInvoiceTemplateParams {
  /** Массив узлов-счетов в чат */
  sendInvoiceEntries: SendInvoiceEntry[];
  /** Массив узлов ссылок на счёт */
  createInvoiceLinkEntries: CreateInvoiceLinkEntry[];
}
