/**
 * @fileoverview Определение компонента снятия с администратора
 * Убрать права администратора
 */
import { ComponentDefinition } from "@shared/schema";

/** Снятие прав администратора с пользователя */
export const demoteUser: ComponentDefinition = {
  id: 'demote-user',
  name: 'Снять с администратора',
  description: 'Убрать права администратора',
  icon: 'fas fa-user-minus',
  color: 'bg-gray-100 text-gray-600',
  type: 'demote_user',
  defaultData: {
    targetUserId: '',
    userIdSource: 'last_message',
    userVariableName: ''
  }
};
