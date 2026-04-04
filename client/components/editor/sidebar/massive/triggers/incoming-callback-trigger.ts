/**
 * @fileoverview Определение компонента триггера входящего callback_query
 * @module components/editor/sidebar/massive/triggers/incoming-callback-trigger
 */

import { ComponentDefinition } from "@shared/schema";

/** Триггер входящего callback_query — срабатывает на каждое нажатие инлайн-кнопки */
export const incomingCallbackTrigger: ComponentDefinition = {
  id: 'incoming-callback-trigger',
  name: 'Триггер нажатия кнопки',
  description: 'Срабатывает на каждое нажатие инлайн-кнопки пользователем. Работает параллельно с основным потоком.',
  icon: 'fas fa-hand-pointer',
  color: 'bg-orange-100 text-orange-600',
  type: 'incoming_callback_trigger' as any,
  defaultData: {
    autoTransitionTo: '',
  },
};
