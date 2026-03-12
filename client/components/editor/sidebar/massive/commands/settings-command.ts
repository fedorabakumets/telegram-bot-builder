/**
 * @fileoverview Определение компонента команды /settings
 * Настройки бота
 */
import { ComponentDefinition } from "@shared/schema";

/** Команда /settings для настроек бота */
export const settingsCommand: ComponentDefinition = {
  id: 'settings-command',
  name: '/settings команда',
  description: 'Настройки бота',
  icon: 'fas fa-cog',
  color: 'bg-gray-100 text-gray-600',
  type: 'command',
  defaultData: {
    command: '/settings',
    description: 'Настройки бота',
    messageText: '⚙️ Настройки бота:',
    keyboardType: 'inline',
    buttons: [
      { id: 'btn-1', text: '📋 Язык', action: 'goto', buttonType: 'normal' as const, target: '/language' },
      { id: 'btn-2', text: '🔔 Уведомления', action: 'goto', buttonType: 'normal' as const, target: '/notifications' }
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
