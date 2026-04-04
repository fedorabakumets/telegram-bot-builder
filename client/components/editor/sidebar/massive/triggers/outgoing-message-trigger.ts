/**
 * @fileoverview Определение компонента триггера исходящего сообщения
 * @module components/editor/sidebar/massive/triggers/outgoing-message-trigger
 */

import { ComponentDefinition } from "@shared/schema";

/** Триггер исходящего сообщения — срабатывает когда бот отправляет сообщение */
export const outgoingMessageTrigger: ComponentDefinition = {
  id: 'outgoing-message-trigger',
  name: 'Триггер исходящего сообщения',
  description: 'Срабатывает когда бот отправляет сообщение пользователю. Работает параллельно с основным потоком.',
  icon: 'fas fa-paper-plane',
  color: 'bg-purple-100 text-purple-600',
  type: 'outgoing_message_trigger' as any,
  defaultData: {
    autoTransitionTo: '',
  },
};
