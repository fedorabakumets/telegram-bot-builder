/**
 * @fileoverview Определение компонента команды /menu
 * Главное меню
 */
import { ComponentDefinition } from "@shared/schema";

/** Команда /menu для главного меню */
export const menuCommand: ComponentDefinition = {
  id: 'menu-command',
  name: '/menu команда',
  description: 'Главное меню',
  icon: 'fas fa-bars',
  color: 'bg-purple-100 text-purple-600',
  type: 'command',
  defaultData: {
    command: '/menu',
    description: 'Главное меню',
    messageText: '📋 Главное меню:',
    keyboardType: 'reply',
    buttons: [
      { id: 'btn-1', text: '📖 Информация', action: 'goto', buttonType: 'normal' as const, target: '/info' },
      { id: 'btn-2', text: '⚙️ Настройки', action: 'goto', buttonType: 'normal' as const, target: '/settings' },
      { id: 'btn-3', text: '❓ Помощь', action: 'goto', buttonType: 'normal' as const, target: '/help' },
      { id: 'btn-4', text: '📞 Поддержка', action: 'goto', buttonType: 'normal' as const, target: '/support' }
    ],
    markdown: true,
    oneTimeKeyboard: false,
    resizeKeyboard: true,
    showInMenu: true,
    isPrivateOnly: false,
    requiresAuth: false,
    adminOnly: false
  }
};
