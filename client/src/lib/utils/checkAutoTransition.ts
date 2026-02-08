import { Node } from '@shared/schema';

/**
 * Проверяет, нужно ли выполнить автопереход из указанного узла
 * @param node - Узел, из которого проверяется автопереход
 * @param nodes - Все узлы для поиска целевого узла
 * @returns Объект с информацией о необходимости автоперехода и целевом узле
 */
export function checkAutoTransition(node: Node, nodes: Node[]): { shouldTransition: boolean; targetNode?: Node; targetNodeId?: string; error?: string } {
  // Проверяем, включена ли функция автоперехода для этого узла
  if (node.data.enableAutoTransition && node.data.autoTransitionTo) {
    // Находим целевой узел
    const targetNode = nodes.find(n => n.id === node.data.autoTransitionTo);

    if (targetNode) {
      return {
        shouldTransition: true,
        targetNode: targetNode,
        targetNodeId: targetNode.id
      };
    } else {
      return {
        shouldTransition: false,
        error: `Target node for auto transition not found: ${node.data.autoTransitionTo}`
      };
    }
  }

  // Если автопереход не включен или целевой узел не найден
  return { shouldTransition: false };
}