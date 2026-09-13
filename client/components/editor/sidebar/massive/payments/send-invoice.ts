/**
 * @fileoverview Определение узла «Выставить счёт в звёздах» для палитры
 * @module components/editor/sidebar/massive/payments/send-invoice
 */

import { ComponentDefinition } from '@shared/schema';

/**
 * Определение компонента счёта в звёздах для сайдбара
 */
export const sendInvoiceNode: ComponentDefinition = {
  id: 'send-invoice',
  name: 'Выставить счёт в звёздах',
  description: 'Отправить счёт на оплату звёздами в текущий чат',
  icon: 'fas fa-star',
  color: 'bg-yellow-100 text-yellow-700',
  type: 'send_invoice' as any,
  defaultData: {
    /** Название товара в счёте */
    invoiceTitle: 'Товар',
    /** Описание товара */
    invoiceDescription: 'Описание товара',
    /** Цена в звёздах */
    invoiceAmount: '1',
    /** URL картинки товара */
    invoicePhotoUrl: '',
    /** Скрытая метка покупки; пусто = id узла */
    invoicePayload: '',
    /** Переменная для суммы оплаты */
    savePaymentAmountTo: '',
    /** Переменная для кода покупки */
    savePaymentChargeIdTo: '',
    /** ID следующего узла после оплаты */
    autoTransitionTo: '',
    /** Включить автопереход после оплаты */
    enableAutoTransition: false,
    keyboardType: 'none',
    buttons: [],
  },
};
