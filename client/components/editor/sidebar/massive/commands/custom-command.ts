/**
 * @fileoverview Определение компонента пользовательской команды
 * Настраиваемая команда
 */
import { ComponentDefinition } from "@shared/schema";

/** Пользовательская команда с настраиваемыми параметрами */
export const customCommand: ComponentDefinition = {
  id: 'custom-command',
  name: 'Пользовательская команда',
  description: 'Настраиваемая команда',
  icon: 'fas fa-terminal',
  color: 'bg-indigo-100 text-indigo-600',
  type: 'command',
  defaultData: {
    command: '/custom',
    description: 'Новая команда',
    messageText: 'Команда выполнена',
    keyboardType: 'none',
    buttons: [],
    markdown: false,
    oneTimeKeyboard: false,
    resizeKeyboard: true,
    showInMenu: true,
    isPrivateOnly: false,
    requiresAuth: false,
    adminOnly: false
  }
};
