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
  description: 'Создать ссылку на оплату (XTR или фиат) и сохранить URL',
  icon: 'fas fa-link',
  color: 'bg-yellow-100 text-yellow-700',
  type: 'create_invoice_link' as any,
  defaultData: {
    /** Название товара */
    invoiceTitle: 'Товар',
    /** Описание товара */
    invoiceDescription: 'Описание товара',
    /** Цена */
    invoiceAmount: '1',
    /** Валюта */
    invoiceCurrency: 'XTR',
    /** Источник токена при фиате */
    invoiceProviderSource: 'inline',
    /** Токен в ноде */
    invoiceProviderToken: '',
    /** Env-ключ токена */
    invoiceProviderTokenEnv: 'PAYMENT_PROVIDER_TOKEN',
    /** Запросить имя (фиат) */
    invoiceNeedName: false,
    /** Запросить email (фиат) */
    invoiceNeedEmail: false,
    /** Запросить телефон (фиат) */
    invoiceNeedPhone: false,
    /** Подписка 30 дней — только XTR */
    invoiceSubscription: false,
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
    /** Переменная для имени покупателя */
    saveOrderNameTo: '',
    /** Переменная для email покупателя */
    saveOrderEmailTo: '',
    /** Переменная для телефона покупателя */
    saveOrderPhoneTo: '',
    /** Сразу после создания ссылки */
    autoTransitionTo: '',
    /** Включить переход после создания */
    enableAutoTransition: false,
    /** После оплаты по этой ссылке */
    afterPaymentTo: '',
  },
};
