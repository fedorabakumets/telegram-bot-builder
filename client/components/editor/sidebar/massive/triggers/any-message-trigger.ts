/**
 * @fileoverview Определение компонента триггера входящего сообщения
 * @module components/editor/sidebar/massive/triggers/any-message-trigger
 */

import { ComponentDefinition } from "@shared/schema";

/** Триггер входящего сообщения — срабатывает на каждое сообщение от пользователя */
export const anyMessageTrigger: ComponentDefinition = {
  id: 'any-message-trigger',
  name: 'Триггер входящего сообщения',
  description: 'Срабатывает на каждое входящее сообщение от пользователя боту',
  icon: 'fas fa-inbox',
  color: 'bg-green-100 text-green-600',
  type: 'incoming_message_trigger',
  defaultData: {},
};
