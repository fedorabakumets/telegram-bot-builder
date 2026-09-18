/**
 * @fileoverview Определение узла «Подписка за звёзды» для палитры
 * @module components/editor/sidebar/massive/payments/edit-star-subscription
 */

import { ComponentDefinition } from '@shared/schema';

/**
 * Управление автопродлением Stars-подписки (editUserStarSubscription)
 */
export const editStarSubscriptionNode: ComponentDefinition = {
  id: 'edit-star-subscription',
  name: 'Подписка за звёзды',
  description: 'Отменить или снова разрешить автопродление по коду покупки',
  icon: 'fas fa-sync-alt',
  color: 'bg-yellow-100 text-yellow-700',
  type: 'edit_star_subscription' as any,
  defaultData: {
    /** Источник user_id */
    subscriptionUserSource: 'current_user',
    /** ID при custom */
    subscriptionUserId: '',
    /** Код покупки */
    subscriptionChargeId: '',
    /** cancel | enable */
    subscriptionAction: 'cancel',
    /** Не рвать сценарий при ошибке */
    ignoreErrors: false,
    /** Текст при пустом коде */
    subscriptionMsgEmpty: 'Укажите код покупки подписки',
    /** Текст при ошибке API */
    subscriptionMsgError: 'Не удалось изменить автопродление. Проверьте код покупки.',
    /** Выход пустого кода */
    subscriptionEmptyTarget: '',
    /** Выход ошибки */
    subscriptionErrorTarget: '',
    /** Успех */
    autoTransitionTo: '',
    enableAutoTransition: false,
    keyboardType: 'none',
    buttons: [],
  },
};
