/**
 * @fileoverview Определение триггера произвольной команды
 * @module components/editor/sidebar/massive/commands/custom-command
 */
import { ComponentDefinition } from "@shared/schema";

/** Триггер произвольной команды */
export const customCommand: ComponentDefinition = {
  id: 'custom-command',
  name: 'Команда',
  description: 'Произвольная команда',
  icon: 'fas fa-terminal',
  color: 'bg-yellow-100 text-yellow-600',
  type: 'command_trigger',
  defaultData: {
    command: '/команда',
    description: 'Описание команды',
    showInMenu: true,
    isPrivateOnly: false,
  }
};
