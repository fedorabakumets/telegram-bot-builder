import { BotNode } from "../bot-generator";

// Функция для проверки наличия inline кнопок (callback)
export function hasInlineButtons(nodes: BotNode[]): boolean {
  if (!nodes || nodes.length === 0) return false;

  return nodes
    .filter(node => node !== null && node !== undefined) // Фильтруем null/undefined узлы
    .some(node => {
    // Проверяем, есть ли callback кнопки в основном узле (независимо от keyboardType)
    const hasMainCallbackButtons = node.data?.buttons &&
      Array.isArray(node.data.buttons) &&
      node.data.buttons.some((button: any) => button.action === 'callback');

    // Проверяем inline кнопки в conditionalMessages (только callback кнопки)
    const hasConditionalInlineButtons = node.data?.conditionalMessages &&
      Array.isArray(node.data.conditionalMessages) &&
      node.data.conditionalMessages.some((condition: any) =>
        condition.buttons &&
        Array.isArray(condition.buttons) &&
        condition.buttons.some((button: any) => button.action === 'callback')
      );

    // Возвращаем true, если есть callback кнопки в основном узле или в conditional messages
    return hasMainCallbackButtons || hasConditionalInlineButtons;
  });
}
