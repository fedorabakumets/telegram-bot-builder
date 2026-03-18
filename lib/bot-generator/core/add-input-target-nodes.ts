/**
 * Вспомогательная функция для добавления целевых узлов ввода к ссылочным узлам
 * @param {Set<string>} inputTargetNodeIds - Множество идентификаторов целевых узлов ввода
 * @param {Set<string>} allReferencedNodeIds - Множество идентификаторов ссылочных узлов для обновления
 */
export function addInputTargetNodes(inputTargetNodeIds: Set<string>, allReferencedNodeIds: Set<string>): void {
  // Добавляем целевые узлы ввода
  inputTargetNodeIds.forEach(nodeId => {
    allReferencedNodeIds.add(nodeId);
  });
}
