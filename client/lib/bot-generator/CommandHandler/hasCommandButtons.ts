import { Node, Button } from "@shared/schema";

// Функция для проверки наличия кнопок команд
export function hasCommandButtons(nodes: Node[]): boolean {
  if (!nodes || nodes.length === 0) return false;

  // Проверяем обычные кнопки
  const hasRegularCommandButtons = nodes.some(node => {
    if (!node.data.buttons || !Array.isArray(node.data.buttons)) return false;
    return node.data.buttons.some((button: Button) => button.action === 'goto' && button.target && button.target.startsWith('/'));
  });

  // Проверяем кнопки в условных сообщениях (но не те, что создают conditional_ callbacks)
  const hasConditionalCommandButtons = nodes.some(node => {
    const conditions = node.data.conditionalMessages;
    if (!conditions || !Array.isArray(conditions)) return false;

    return conditions.some((cond: any) => {
      if (!cond.buttons || !Array.isArray(cond.buttons)) return false;
      // Только кнопки команд БЕЗ переменных (они не создают conditional_ callbacks)
      return cond.buttons.some((button: Button) => button.action === 'goto' && !cond.variableName && !cond.variableNames && button.target && button.target.startsWith('/')
      );
    });
  });

  return hasRegularCommandButtons || hasConditionalCommandButtons;
}
