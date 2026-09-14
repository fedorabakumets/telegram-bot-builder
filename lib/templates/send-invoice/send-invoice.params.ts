/**
 * @fileoverview Параметры шаблона send_invoice / create_invoice_link
 * @module templates/send-invoice/send-invoice.params
 */

/** Параметры одного узла send_invoice */
export interface SendInvoiceEntry {
  /** ID узла */
  nodeId: string;
  /** Название товара */
  title: string;
  /** Описание товара */
  description: string;
  /** Цена в звёздах (строка, допускает {переменные}) */
  amount: string;
  /** URL картинки (пусто если нет) */
  photoUrl: string;
  /** Скрытая метка покупки (уже разрешённая: payload или nodeId) */
  payload: string;
  /** Переменная для суммы оплаты */
  savePaymentAmountTo: string;
  /** Переменная для кода покупки */
  savePaymentChargeIdTo: string;
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
  /** Цена в звёздах */
  amount: string;
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
  /** Сразу после создания ссылки */
  autoTransitionTo: string;
  /** После оплаты по ссылке */
  afterPaymentTo: string;
}

/** Параметры шаблона всех счетов */
export interface SendInvoiceTemplateParams {
  /** Массив узлов-счетов в чат */
  sendInvoiceEntries: SendInvoiceEntry[];
  /** Массив узлов ссылок на счёт */
  createInvoiceLinkEntries: CreateInvoiceLinkEntry[];
}
