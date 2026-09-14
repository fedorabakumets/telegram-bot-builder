/**
 * @fileoverview Определение узла «Ссылка на счёт» для палитры
 * @module components/editor/sidebar/massive/payments/create-invoice-link
 */

import { ComponentDefinition } from '@shared/schema';

/**
 * Определение компонента ссылки на счёт в звёздах
 */
export const createInvoiceLinkNode: ComponentDefinition = {
  id: 'create-invoice-link',
  name: 'Ссылка на счёт',
  description: 'Создать ссылку на оплату звёздами и сохранить URL в переменную',
  icon: 'fas fa-link',
  color: 'bg-yellow-100 text-yellow-700',
  type: 'create_invoice_link' as any,
  defaultData: {
    /** Название товара */
    invoiceTitle: 'Товар',
    /** Описание товара */
    invoiceDescription: 'Описание товара',
    /** Цена в звёздах */
    invoiceAmount: '1',
    /** URL картинки */
    invoicePhotoUrl: '',
    /** Скрытая метка покупки; пусто = id узла */
    invoicePayload: '',
    /** Куда сохранить ссылку */
    saveInvoiceLinkTo: 'invoice_url',
    /** Переменная для суммы после оплаты */
    savePaymentAmountTo: '',
    /** Переменная для кода покупки после оплаты */
    savePaymentChargeIdTo: '',
    /** Сразу после создания ссылки */
    autoTransitionTo: '',
    /** Включить переход после создания */
    enableAutoTransition: false,
    /** После оплаты по этой ссылке */
    afterPaymentTo: '',
  },
};
