/**
 * @fileoverview Определение компонента триггера inline-кнопки
 *
 * Узел callback_trigger срабатывает когда пользователь нажимает
 * inline-кнопку с заданным значением callback_data.
 * @module components/editor/sidebar/massive/triggers/callback-trigger
 */

import { ComponentDefinition } from "@shared/schema";

/** Триггер inline-кнопки — точка входа по нажатию кнопки */
export const callbackTrigger: ComponentDefinition = {
  id: 'callback-trigger',
  name: 'Триггер inline-кнопки',
  description: 'Срабатывает когда пользователь нажимает inline-кнопку с заданным callback_data',
  icon: 'fas fa-hand-pointer',
  color: 'bg-orange-100 text-orange-600',
  type: 'callback_trigger' as any,
  defaultData: {
    /** Значение callback_data кнопки */
    callbackData: 'my_callback',
    /** Режим совпадения: точное или по началу строки */
    matchType: 'exact',
  }
};
