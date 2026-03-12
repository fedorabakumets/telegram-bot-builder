/**
 * @fileoverview Определение компонента удаления сообщения
 * Удаление сообщения в группе
 */
import { ComponentDefinition } from "@shared/schema";

/** Удаление сообщения из чата */
export const deleteMessage: ComponentDefinition = {
  id: 'delete-message',
  name: 'Удалить сообщение',
  description: 'Удаление сообщения в группе',
  icon: 'fas fa-trash',
  color: 'bg-red-100 text-red-600',
  type: 'delete_message',
  defaultData: {
    command: '/delete_message',
    targetMessageId: '',
    messageIdSource: 'last_message',
    variableName: ''
  }
};
