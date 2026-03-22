/**
 * @fileoverview Пресет команды /menu — главное меню бота
 * @module components/editor/sidebar/massive/commands/menu-command
 */
import type { CommandPreset } from './command-preset.types';

/** Пресет команды /menu — создаёт command_trigger + message на холсте */
export const menuCommand: CommandPreset = {
  id: 'menu-command',
  name: '/menu',
  description: 'Главное меню бота',
  icon: 'fas fa-bars',
  color: 'bg-purple-100 text-purple-600',
  type: 'command_preset',
  triggerData: {
    command: '/menu',
    description: 'Главное меню',
    showInMenu: true,
  },
  messageData: {
    text: '📋 Главное меню',
    buttons: [
      { text: '📝 Пункт 1' },
      { text: '📝 Пункт 2' },
    ],
  },
};
