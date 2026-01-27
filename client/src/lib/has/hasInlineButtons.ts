import { Node } from '../../../../shared/schema';

/**
 * Функция для проверки наличия inline кнопок (callback) в узлах бота
 * @param nodes Массив узлов бота для проверки
 * @returns true, если в узлах есть inline кнопки
 */
export function hasInlineButtons(nodes: readonly Node[]): boolean {
  if (!nodes || nodes.length === 0) return false;

  return nodes.some(node => {
    // Проверяем основные inline кнопки
    const hasMainInlineButtons = node.data.keyboardType === 'inline' && node.data.buttons && node.data.buttons.length > 0;

    // Проверяем inline кнопки в conditionalMessages (любые кнопки с callback действиями)
    const hasConditionalInlineButtons = node.data.conditionalMessages &&
      node.data.conditionalMessages.some((condition: any) => condition.buttons && condition.buttons.length > 0
      );

    return hasMainInlineButtons || hasConditionalInlineButtons;
  });
}
