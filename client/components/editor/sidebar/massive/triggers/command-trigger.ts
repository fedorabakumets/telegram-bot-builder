/**
 * @fileoverview Определение компонента триггера команды
 * Узел-триггер без контента — содержит только команду и синонимы.
 * Контент (сообщения, кнопки) задаётся в следующих узлах цепочки.
 * @module components/editor/sidebar/massive/triggers/command-trigger
 */

import { ComponentDefinition } from "@shared/schema";

/** Триггер команды — точка входа без контента */
export const commandTrigger: ComponentDefinition = {
  id: 'command-trigger',
  name: 'Триггер команды',
  description: 'Команда или синонимы без контента',
  icon: 'fas fa-bolt',
  color: 'bg-yellow-100 text-yellow-600',
  type: 'command_trigger',
  defaultData: {
    command: '/start',
    description: 'Запустить бота',
    showInMenu: true,
    synonyms: [],
    matchMode: 'exact',
    isPrivateOnly: false,
  }
};
