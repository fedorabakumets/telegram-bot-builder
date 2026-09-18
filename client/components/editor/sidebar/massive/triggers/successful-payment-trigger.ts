/**
 * @fileoverview Определение триггера успешной оплаты звёздами
 * @module components/editor/sidebar/massive/triggers/successful-payment-trigger
 */

import { ComponentDefinition } from '@shared/schema';

/**
 * Триггер: оплата звёздами вне цепочки текущего счёта
 * (ссылка, старый счёт после рестарта и т.п.)
 */
export const successfulPaymentTrigger: ComponentDefinition = {
  id: 'successful-payment-trigger',
  name: 'Успешная оплата',
  description: 'Срабатывает при оплате звёздами, если счёт не из текущей цепочки',
  icon: 'fas fa-check-circle',
  color: 'bg-yellow-100 text-yellow-700',
  type: 'successful_payment_trigger' as any,
  defaultData: {
    /** Фильтр метки: all | exact | starts_with */
    payloadFilter: 'all',
    /** Значение метки для exact / starts_with */
    payloadValue: '',
    /** Переменная для суммы оплаты */
    savePaymentAmountTo: 'payment_amount',
    /** Переменная для кода покупки */
    savePaymentChargeIdTo: 'payment_charge_id',
    /** ID следующего узла */
    autoTransitionTo: '',
    /** Включить переход */
    enableAutoTransition: false,
  },
};
