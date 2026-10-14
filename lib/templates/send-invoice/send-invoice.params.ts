/**
 * @fileoverview Параметры шаблона send_invoice / create_invoice_link
 * @module templates/send-invoice/send-invoice.params
 */

import type { InvoiceCurrencyCode } from '@shared/invoice-currencies';
import type { InvoicePriceLine } from './invoice-prices-utils';

export type { InvoiceCurrencyCode } from '@shared/invoice-currencies';
export type { InvoicePriceLine } from './invoice-prices-utils';

/** Источник токена провайдера */
export type InvoiceProviderSource = 'inline' | 'env';

/** Режим pre_checkout: always — всегда подтверждать, condition — проверка переменной */
export type PreCheckoutMode = 'always' | 'condition';

/**
 * Операторы переменной для отказа до списания.
 * Те же, что у condition, кроме системных (чат, подписка, else): на pre_checkout нет сообщения и есть лимит 10 секунд.
 */
export const PRE_CHECKOUT_OPERATORS = [
  'filled',
  'empty',
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'starts_with',
  'ends_with',
  'matches_regex',
  'greater_than',
  'less_than',
  'between',
  'is_even',
  'is_odd',
  'divisible_by',
] as const;

/** Оператор проверки перед оплатой */
export type PreCheckoutOperator = (typeof PRE_CHECKOUT_OPERATORS)[number];

/** Запасной текст отказа, если поле пустое */
export const PRE_CHECKOUT_FALLBACK_ERROR = 'Оплата сейчас недоступна';

/** Правило отказа до списания (статический payload без {переменных}) */
export interface PreCheckoutRule {
  /** Метка покупки, по которой ищется правило */
  payload: string;
  /** Имя переменной пользователя */
  variable: string;
  /** Оператор сравнения */
  operator: string;
  /** Значение сравнения */
  value: string;
  /** Второе значение для between */
  value2: string;
  /** Текст error_message, уже с запасным русским, если поле было пустым */
  errorMessage: string;
}

/** Поля проверки перед списанием на узле счёта или ссылки */
export interface PreCheckoutFields {
  /** always — ok=True; condition — проверка переменной в pre_checkout */
  preCheckoutMode: PreCheckoutMode;
  /** Имя переменной пользователя */
  preCheckoutVariable: string;
  /** Оператор из PRE_CHECKOUT_OPERATORS */
  preCheckoutOperator: PreCheckoutOperator;
  /** Правое значение, допускает {переменные} */
  preCheckoutValue: string;
  /** Верхняя граница для between */
  preCheckoutValue2: string;
  /** Текст отказа; пусто при condition заменяется запасным */
  preCheckoutErrorMessage: string;
}

/** Общие платёжные поля счёта / ссылки */
export interface InvoicePaymentCommon {
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
  /** Запросить адрес доставки */
  needShipping: boolean;
  /** is_flexible */
  isFlexible: boolean;
  /** send_phone_number_to_provider */
  sendPhoneToProvider: boolean;
  /** send_email_to_provider */
  sendEmailToProvider: boolean;
  /** max_tip_amount как строка (пусто = нет) */
  maxTipAmount: string;
  /** suggested tip amounts */
  suggestedTipAmounts: number[];
  /** provider_data сырой текст */
  providerData: string;
  /** URL картинки */
  photoUrl: string;
  /** photo_size */
  photoSize: string;
  /** photo_width */
  photoWidth: string;
  /** photo_height */
  photoHeight: string;
  /** Строки LabeledPrice */
  priceLines: InvoicePriceLine[];
}

/** Параметры одного узла send_invoice */
export interface SendInvoiceEntry extends InvoicePaymentCommon, PreCheckoutFields {
  /** ID узла */
  nodeId: string;
  /** Название товара */
  title: string;
  /** Описание товара */
  description: string;
  /** Цена fallback (если priceLines пуст — уже развёрнуто в priceLines) */
  amount: string;
  /** Скрытая метка покупки */
  payload: string;
  /** protect_content */
  protectContent: boolean;
  /** start_parameter */
  startParameter: string;
  /** message_thread_id */
  messageThreadId: string;
  /** direct_messages_topic_id */
  directMessagesTopicId: string;
  /** disable_notification */
  disableNotification: boolean;
  /** reply_to message_id */
  replyToMessageId: string;
  /** message_effect_id */
  messageEffectId: string;
  /** allow_paid_broadcast */
  allowPaidBroadcast: boolean;
  /** suggested_post_parameters JSON */
  suggestedPostParams: string;
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
export interface CreateInvoiceLinkEntry extends InvoicePaymentCommon, PreCheckoutFields {
  /** ID узла */
  nodeId: string;
  /** Название товара */
  title: string;
  /** Описание товара */
  description: string;
  /** Цена fallback */
  amount: string;
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
  /** Есть условие отказа хотя бы на одном счёте или ссылке */
  hasPreCheckoutRules?: boolean;
  /** Статические правила отказа (payload без {переменных}) */
  preCheckoutRules?: PreCheckoutRule[];
}
