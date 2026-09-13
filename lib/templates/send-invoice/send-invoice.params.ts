/**
 * @fileoverview Параметры шаблона send_invoice (счёт в звёздах)
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
}

/** Параметры шаблона всех счетов */
export interface SendInvoiceTemplateParams {
  /** Массив узлов-счетов */
  sendInvoiceEntries: SendInvoiceEntry[];
}
