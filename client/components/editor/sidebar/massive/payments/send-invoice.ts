/**
 * @fileoverview Определение узла «Выставить счёт» для палитры
 * @module components/editor/sidebar/massive/payments/send-invoice
 */

import { ComponentDefinition } from '@shared/schema';

/**
 * Определение компонента счёта в звёздах для сайдбара
 */
export const sendInvoiceNode: ComponentDefinition = {
  id: 'send-invoice',
  name: 'Выставить счёт',
  description: 'Отправить счёт: звёзды (XTR) или фиат через провайдера BotFather',
  icon: 'fas fa-star',
  color: 'bg-yellow-100 text-yellow-700',
  type: 'send_invoice' as any,
  defaultData: {
    /** Название товара в счёте */
    invoiceTitle: 'Товар',
    /** Описание товара */
    invoiceDescription: 'Описание товара',
    /** Цена (звёзды или минорные единицы) */
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
    /** URL картинки товара */
    invoicePhotoUrl: '',
    /** Скрытая метка покупки; пусто = id узла */
    invoicePayload: '',
    /** Переменная для суммы оплаты */
    savePaymentAmountTo: '',
    /** Переменная для кода покупки */
    savePaymentChargeIdTo: '',
    /** Переменная для имени покупателя */
    saveOrderNameTo: '',
    /** Переменная для email покупателя */
    saveOrderEmailTo: '',
    /** Переменная для телефона покупателя */
    saveOrderPhoneTo: '',
    /** ID следующего узла после оплаты */
    autoTransitionTo: '',
    /** Включить автопереход после оплаты */
    enableAutoTransition: false,
    /** Клавиатура — отдельным узлом рядом (создаётся при добавлении) */
    keyboardType: 'none',
    buttons: [],
  },
};
