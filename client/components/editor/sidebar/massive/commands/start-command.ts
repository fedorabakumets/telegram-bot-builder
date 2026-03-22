/**
 * @fileoverview Определение триггера команды /start
 * @module components/editor/sidebar/massive/commands/start-command
 */
import { ComponentDefinition } from "@shared/schema";

/** Триггер команды /start — точка входа в бота */
export const startCommand: ComponentDefinition = {
  id: 'start-command',
  name: '/start',
  description: 'Точка входа в бота',
  icon: 'fas fa-play',
  color: 'bg-green-100 text-green-600',
  type: 'command_trigger',
  defaultData: {
    command: '/start',
    description: 'Запустить бота',
    showInMenu: true,
    isPrivateOnly: false,
  }
};
