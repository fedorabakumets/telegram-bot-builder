/**
 * @fileoverview Определение триггера команды /help
 * @module components/editor/sidebar/massive/commands/help-command
 */
import { ComponentDefinition } from "@shared/schema";

/** Триггер команды /help — справка по боту */
export const helpCommand: ComponentDefinition = {
  id: 'help-command',
  name: '/help',
  description: 'Справка по боту',
  icon: 'fas fa-question-circle',
  color: 'bg-blue-100 text-blue-600',
  type: 'command_trigger',
  defaultData: {
    command: '/help',
    description: 'Справка по боту',
    showInMenu: true,
    isPrivateOnly: false,
  }
};
