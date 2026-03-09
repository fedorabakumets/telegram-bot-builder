/**
 * @fileoverview Добавление обработчиков командных кнопок
 * Функция для добавления callback-обработчиков команд в Python-код
 */

import { findCommandNode, generateCommandCallbackHandler, generateCommandTrigger } from './generate-command-handlers';

/**
 * Добавляет обработчики callback-запросов для командных кнопок
 * @param commandButtons - Набор callback идентификаторов команд
 * @param code - Текущий Python код
 * @param nodes - Массив узлов бота
 * @returns {string} Обновлённый Python код
 */
export const addCommandCallbackHandlers = (
  commandButtons: Set<string>,
  code: string,
  nodes: any[]
): string => {
  if (commandButtons.size > 0) {
    code += '\n# Обработчики для кнопок команд\n';
    code += `# Найдено ${commandButtons.size} кнопок команд: ${Array.from(commandButtons).join(', ')}\n`;

    commandButtons.forEach(commandCallback => {
      code = generateCommandCallbackHandler(commandCallback, code);

      // Найти соответствующий обработчик команды
      const commandNode = findCommandNode(commandCallback, nodes);
      code = generateCommandTrigger(commandCallback, code, commandNode);
    });
  }

  return code;
};
