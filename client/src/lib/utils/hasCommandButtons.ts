import { Button } from "../bot-generator";
import { BotNode } from "../bot-generator";

// Функция для проверки наличия кнопок команд
function hasCommandButtons(nodes: BotNode[]): boolean {
  if (!nodes || nodes.length === 0) return false;

  // Проверяем обычные кнопки
  const hasRegularCommandButtons = nodes.some(node => {
    if (!node.data.buttons || !Array.isArray(node.data.buttons)) return false;
    return node.data.buttons.some((button: Button) => button.action === 'command');
  });

  // Проверяем кнопки в условных сообщениях (но не те, что создают conditional_ callbacks)
  const hasConditionalCommandButtons = nodes.some(node => {
    const conditions = node.data.conditionalMessages;
    if (!conditions || !Array.isArray(conditions)) return false;

    return conditions.some((cond: any) => {
      if (!cond.buttons || !Array.isArray(cond.buttons)) return false;
      // Только кнопки команд БЕЗ переменных (они не создают conditional_ callbacks)
      return cond.buttons.some((button: Button) => button.action === 'command' && !cond.variableName && !cond.variableNames
      );
    });
  });

  return hasRegularCommandButtons || hasConditionalCommandButtons;
}
