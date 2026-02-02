import { Button } from "../bot-generator";
import { Node } from "@shared/schema";




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
