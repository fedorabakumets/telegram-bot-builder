/**
 * @fileoverview Определение компонента снятия ограничений
 * Восстановить права участника
 */
import { ComponentDefinition } from "@shared/schema";

/** Снятие ограничений с пользователя */
export const unmuteUser: ComponentDefinition = {
  id: 'unmute-user',
  name: 'Снять ограничения',
  description: 'Восстановить права участника',
  icon: 'fas fa-volume-up',
  color: 'bg-green-100 text-green-600',
  type: 'unmute_user',
  defaultData: {
    command: '/unmute_user',
    targetUserId: '',
    userIdSource: 'last_message',
    userVariableName: ''
  }
};
