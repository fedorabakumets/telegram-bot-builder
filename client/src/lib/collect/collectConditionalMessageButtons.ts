import { Button } from './bot-generator';

/**
 * Вспомогательная функция для сбора кнопок из условных сообщений
 * @param {any[]} nodes - Массив узлов для извлечения кнопок
 * @param {Set<string>} allConditionalButtons - Множество кнопок для обновления
 */
export function collectConditionalMessageButtons(nodes: any[], allConditionalButtons: Set<string>): void {
  // Собираем кнопки из условных сообщений
  (nodes || []).forEach(node => {
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
