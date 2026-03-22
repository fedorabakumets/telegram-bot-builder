/**
 * @fileoverview Определение триггера команды /settings
 * @module components/editor/sidebar/massive/commands/settings-command
 */
import { ComponentDefinition } from "@shared/schema";

/** Триггер команды /settings — настройки бота */
export const settingsCommand: ComponentDefinition = {
  id: 'settings-command',
  name: '/settings',
  description: 'Настройки бота',
  icon: 'fas fa-cog',
  color: 'bg-gray-100 text-gray-600',
  type: 'command_trigger',
  defaultData: {
    command: '/settings',
    description: 'Настройки',
    showInMenu: true,
    isPrivateOnly: false,
  }
};
