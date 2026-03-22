/**
 * @fileoverview Определение триггера команды /menu
 * @module components/editor/sidebar/massive/commands/menu-command
 */
import { ComponentDefinition } from "@shared/schema";

/** Триггер команды /menu — главное меню бота */
export const menuCommand: ComponentDefinition = {
  id: 'menu-command',
  name: '/menu',
  description: 'Главное меню бота',
  icon: 'fas fa-bars',
  color: 'bg-purple-100 text-purple-600',
  type: 'command_trigger',
  defaultData: {
    command: '/menu',
    description: 'Главное меню',
    showInMenu: true,
    isPrivateOnly: false,
  }
};
