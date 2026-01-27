import { Button } from "../bot-generatornew";

// Функция для проверки наличия условных кнопок с callback_data формата "conditional_"
export function hasConditionalButtons(nodes: Node[]): boolean {
  if (!nodes || nodes.length === 0) return false;

  return nodes.some(node => {
    const conditions = node.data.conditionalMessages;
    if (!conditions || !Array.isArray(conditions)) return false;

    return conditions.some((cond: any) => {
      if (!cond.buttons || !Array.isArray(cond.buttons)) return false;
      // Проверяем, есть ли кнопки команд в условных сообщениях с переменными
      return cond.buttons.some((button: Button) => button.action === 'command' && (cond.variableName || cond.variableNames)
      );
    });
  });
}
