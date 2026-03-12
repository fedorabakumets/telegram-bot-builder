/**
 * @fileoverview Определение компонента команды /help
 * Справка по боту
 */
import { ComponentDefinition } from "@shared/schema";

/** Команда /help для справки по боту */
export const helpCommand: ComponentDefinition = {
  id: 'help-command',
  name: '/help команда',
  description: 'Справка по боту',
  icon: 'fas fa-question-circle',
  color: 'bg-blue-100 text-blue-600',
  type: 'command',
  defaultData: {
    command: '/help',
    description: 'Справка по боту',
    messageText: '🤖 Доступные команды:\n\n/start - Начать работу\n/help - Эта справка\n/settings - Настройки',
    keyboardType: 'none',
    buttons: [],
    markdown: true,
    oneTimeKeyboard: false,
    resizeKeyboard: true,
    showInMenu: true,
    isPrivateOnly: false,
    requiresAuth: false,
    adminOnly: false
  }
};
