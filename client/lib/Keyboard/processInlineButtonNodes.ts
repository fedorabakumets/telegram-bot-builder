/**
 * Вспомогательная функция для обработки узлов inline кнопок
 * @param {any[]} inlineNodes - Массив узлов inline кнопок
 * @param {Set<string>} allReferencedNodeIds - Множество идентификаторов узлов для обновления
 */
export function processInlineButtonNodes(inlineNodes: any[], allReferencedNodeIds: Set<string>): void {
  // Добавляем узлы из inline кнопок
  inlineNodes.forEach(node => {
    node.data.buttons.forEach((button: { action: string; target: string; }) => {
      if (button.action === 'goto' && button.target) {
        allReferencedNodeIds.add(button.target);
      }
    });

    // Также добавляем continueButtonTarget для узлов с мультивыбором
    if (node.data.continueButtonTarget) {
      allReferencedNodeIds.add(node.data.continueButtonTarget);
    }
  });
}
