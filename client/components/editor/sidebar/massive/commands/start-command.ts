/**
 * @fileoverview Пресет команды /start — точка входа в бота
 * @module components/editor/sidebar/massive/commands/start-command
 */
import type { CommandPreset } from './command-preset.types';

/** Пресет команды /start — создаёт command_trigger + message на холсте */
export const startCommand: CommandPreset = {
  id: 'start-command',
  name: '/start',
  description: 'Точка входа в бота',
  icon: 'fas fa-play',
  color: 'bg-green-100 text-green-600',
  type: 'command_preset',
  triggerData: {
    command: '/start',
    description: 'Запустить бота',
    showInMenu: true,
  },
  messageData: {
    text: '👋 Привет! Я бот. Чем могу помочь?',
    buttons: [
      { text: '📋 Меню' },
      { text: '❓ Помощь' },
    ],
  },
};
