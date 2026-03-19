/**
 * @fileoverview Определение компонента команды /start
 * Точка входа в бота
 */
import { ComponentDefinition } from "@shared/schema";

/** Команда /start для запуска бота */
export const startCommand: ComponentDefinition = {
  id: 'start-command',
  name: '/start команда',
  description: 'Точка входа в бота',
  icon: 'fas fa-play',
  color: 'bg-green-100 text-green-600',
  type: 'start',
  defaultData: {
    command: '/start',
    description: 'Запустить бота',
    messageText: 'Привет! Добро пожаловать!',
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
