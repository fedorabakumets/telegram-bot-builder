/**
 * @fileoverview Утилиты для работы с командами бота
 *
 * Вынесено из bot-generator.ts для устранения вложенных функций.
 *
 * @module bot-generator/utils/command-utils
 */

import type { Button } from '../types';

/**
 * Собирает все callback-идентификаторы команд из узлов бота
 * @param nodes - Массив узлов бота
 * @returns Уникальные callback идентификаторы команд
 */
export function collectAllCommandCallbacksFromNodes(nodes: any[]): Set<string> {
  const commandButtons = new Set<string>();

  nodes.forEach(node => {
    // Обычные кнопки узла
    if (node.data?.buttons) {
      node.data.buttons.forEach((button: Button) => {
        if (button.action === 'goto' && button.target) {
          const commandCallback = `cmd_${button.target.replace('/', '')}`;
          commandButtons.add(commandCallback);
        }
      });
    }

    // Кнопки в условных сообщениях
    if (node.data?.conditionalMessages) {
      node.data.conditionalMessages.forEach((condition: any) => {
        if (condition.buttons) {
          condition.buttons.forEach((button: Button) => {
            if (button.action === 'goto' && button.target) {
              const commandCallback = `cmd_${button.target.replace('/', '')}`;
              commandButtons.add(commandCallback);
            }
          });
        }
      });
    }
  });

  return commandButtons;
}

/**
 * Находит узел команды по имени callback
 * @param commandCallback - Callback команды (cmd_xxx)
 * @param nodes - Массив узлов бота
 * @returns Узел команды или null
 */
export function findCommandNode(commandCallback: string, nodes: any[]): any | null {
  const command = commandCallback.replace('cmd_', '');
  return nodes.find(
    n => n.data.command === `/${command}` || n.data.command === command
  ) || null;
}
