/**
 * @fileoverview Утилиты для работы с командами бота
 *
 * @module bot-generator/core/command-utils
 */

import type { Node, Button } from '@shared/schema';

/**
 * Собирает все callback-идентификаторы команд из узлов бота
 * @param nodes - Массив узлов бота
 * @returns Уникальные callback идентификаторы команд
 */
export function collectAllCommandCallbacksFromNodes(nodes: Node[]): Set<string> {
  const commandButtons = new Set<string>();

  nodes.forEach(node => {
    if (node.data?.buttons) {
      node.data.buttons.forEach((button: Button) => {
        // Только кнопки с action === 'command', не goto
        if (button.action === 'command' && button.target) {
          const commandCallback = `cmd_${button.target.replace('/', '')}`;
          commandButtons.add(commandCallback);
        }
      });
    }

    if (node.data?.conditionalMessages) {
      node.data.conditionalMessages.forEach((condition: { buttons?: Button[] }) => {
        if (condition.buttons) {
          condition.buttons.forEach((button: Button) => {
            if (button.action === 'command' && button.target) {
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
export function findCommandNode(commandCallback: string, nodes: Node[]): Node | null {
  const command = commandCallback.replace('cmd_', '');
  return nodes.find(
    n => n.data.command === `/${command}` || n.data.command === command
  ) || null;
}
