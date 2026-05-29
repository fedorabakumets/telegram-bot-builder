/**
 * @fileoverview Определение компонента исключения пользователя
 * Удалить участника из группы
 */
import { ComponentDefinition } from "@shared/schema";

/** Исключение пользователя из группы */
export const kickUser: ComponentDefinition = {
  id: 'kick-user',
  name: 'Исключить пользователя',
  description: 'Удалить участника из группы',
  icon: 'fas fa-user-times',
  color: 'bg-red-100 text-red-600',
  type: 'kick_user',
  defaultData: {
    userIdSource: 'current_user',
    userIdManual: '',
    userVariableName: '',
    chatIdSource: 'current_chat',
    chatIdManual: '',
    ignoreErrors: true,
  }
};
