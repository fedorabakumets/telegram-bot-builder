import { Button } from "../bot-generator";
import { Node } from "@shared/schema";

/**
 * Интерфейс условной кнопки сообщения
 */
interface ConditionalMessageButton {
  action: string;
  label: string;
  [key: string]: unknown;
}

/**
 * Интерфейс условного сообщения
 */
interface ConditionalMessage {
  condition: string;
  message: string;
  buttons?: Button[];
  [key: string]: unknown;
}

/**
 * Интерфейс данных узла
 */
interface NodeData {
  conditionalMessageButtons?: ConditionalMessageButton[];
  conditionalMessages?: ConditionalMessage[];
  [key: string]: unknown;
}

/**
 * Интерфейс узла
 */
interface LocalNode {
  data: NodeData;
  [key: string]: unknown;
}

/**
 * Вспомогательная функция для сбора кнопок из условных сообщений
 * @param {Node[]} nodes - Массив узлов для извлечения кнопок
 * @param {Set<string>} allConditionalButtons - Множество кнопок для обновления
 */

export function collectConditionalMessageButtons(nodes: Node[], allConditionalButtons: Set<string>): void {
  // Собираем кнопки из условных сообщений
  (nodes || []).forEach((node: Node) => {
    if (node.data.conditionalMessages) {
      node.data.conditionalMessages.forEach((condition: any) => {
        if (condition.buttons) {
          condition.buttons.forEach((button: Button) => {
            if (button.action === 'goto' && button.target) {
              allConditionalButtons.add(button.target);
            }
          });
        }
      });
    }
  });
}
