/**
 * @fileoverview Определение компонента блокировки пользователя
 * Забанить участника группы
 */
import { ComponentDefinition } from "@shared/schema";

/** Блокировка пользователя (бан) */
export const banUser: ComponentDefinition = {
  id: 'ban-user',
  name: 'Заблокировать пользователя',
  description: 'Забанить участника группы',
  icon: 'fas fa-ban',
  color: 'bg-red-100 text-red-600',
  type: 'ban_user',
  defaultData: {
    command: '/ban_user',
    targetUserId: '',
    userIdSource: 'last_message',
    userVariableName: '',
    reason: 'Нарушение правил группы',
    untilDate: 0
  }
};
