/**
 * @fileoverview Определение компонента триггера любого сообщения
 * @module components/editor/sidebar/massive/triggers/any-message-trigger
 */

import { ComponentDefinition } from "@shared/schema";

/** Триггер любого сообщения — срабатывает на любой входящий текст */
export const anyMessageTrigger: ComponentDefinition = {
  id: 'any-message-trigger',
  name: 'Любое сообщение',
  description: 'Срабатывает на любое входящее сообщение (fallback)',
  icon: 'fas fa-inbox',
  color: 'bg-green-100 text-green-600',
  type: 'any_message_trigger',
  defaultData: {},
};
