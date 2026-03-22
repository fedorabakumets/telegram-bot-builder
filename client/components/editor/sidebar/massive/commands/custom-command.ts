/**
 * @fileoverview Пресет произвольной команды
 * @module components/editor/sidebar/massive/commands/custom-command
 */
import type { CommandPreset } from './command-preset.types';

/** Пресет произвольной команды — создаёт command_trigger + message на холсте */
export const customCommand: CommandPreset = {
  id: 'custom-command',
  name: 'Команда',
  description: 'Произвольная команда',
  icon: 'fas fa-terminal',
  color: 'bg-yellow-100 text-yellow-600',
  type: 'command_preset',
  triggerData: {
    command: '/команда',
    description: 'Описание команды',
    showInMenu: true,
  },
  messageData: {
    text: 'Ответ на команду',
  },
};
