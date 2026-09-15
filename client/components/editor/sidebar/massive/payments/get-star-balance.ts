/**
 * @fileoverview Определение узла «Баланс звёзд» для палитры
 * @module components/editor/sidebar/massive/payments/get-star-balance
 */

import { ComponentDefinition } from '@shared/schema';

/**
 * Получение баланса Telegram Stars на счету бота (getMyStarBalance)
 */
export const getStarBalanceNode: ComponentDefinition = {
  id: 'get-star-balance',
  name: 'Баланс звёзд',
  description: 'Сколько звёзд сейчас на боте — перед выводом или возвратом',
  icon: 'fas fa-coins',
  color: 'bg-yellow-100 text-yellow-700',
  type: 'get_star_balance' as any,
  defaultData: {
    /** Куда сохранить целое amount */
    saveStarBalanceTo: 'star_balance',
    /** Не рвать сценарий при ошибке */
    ignoreErrors: false,
    /** Текст ошибки API */
    balanceMsgError: 'Не удалось получить баланс звёзд',
    /** Выход ошибки */
    balanceErrorTarget: '',
    /** Успех */
    autoTransitionTo: '',
    enableAutoTransition: false,
    keyboardType: 'none',
    buttons: [],
  },
};
