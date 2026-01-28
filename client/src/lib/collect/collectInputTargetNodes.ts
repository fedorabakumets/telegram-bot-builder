/**
 * Вспомогательная функция для сбора целевых узлов ввода
 * @param {any[]} nodes - Массив узлов для извлечения целевых узлов ввода
 * @returns {Set<string>} Множество идентификаторов целевых узлов ввода
 */
export function collectInputTargetNodes(nodes: any[]): Set<string> {
  const inputTargetNodeIds = new Set<string>();
  (nodes || []).forEach(node => {
    if (node.data.inputTargetNodeId) {
      inputTargetNodeIds.add(node.data.inputTargetNodeId);
    }
  });
  return inputTargetNodeIds;
}
