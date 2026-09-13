/**
 * @fileoverview Определение узла «Вернуть звёзды» для палитры
 * @module components/editor/sidebar/massive/payments/refund-stars
 */

import { ComponentDefinition } from '@shared/schema';

/**
 * Определение компонента возврата звёзд для сайдбара
 */
export const refundStarsNode: ComponentDefinition = {
  id: 'refund-stars',
  name: 'Вернуть звёзды',
  description: 'Вернуть звёзды покупателю по коду покупки',
  icon: 'fas fa-undo',
  color: 'bg-yellow-100 text-yellow-700',
  type: 'refund_stars' as any,
  defaultData: {
    /** Источник user_id: current_user | custom */
    refundUserSource: 'current_user',
    /** ID пользователя при custom */
    refundUserId: '',
    /** Код покупки telegram_payment_charge_id */
    refundChargeId: '',
    /** Не прерывать сценарий при ошибке */
    ignoreErrors: false,
    /** ID следующего узла после успешного возврата */
    autoTransitionTo: '',
    /** Включить автопереход */
    enableAutoTransition: false,
    keyboardType: 'none',
    buttons: [],
  },
};
