/**
 * Идентифицирует узлы, требующие логику множественного выбора
 * Находит все узлы в графе с включенной опцией множественного выбора и возвращает их список
 * @returns {Array<Node>} Массив узлов с множественным выбором
 */
export function identifyNodesRequiringMultiSelectLogic(nodes: any[], isLoggingEnabled: () => boolean) {
  const multiSelectNodes = (nodes || []).filter((node: any) => node.data.allowMultipleSelection
  );
  if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔍 ГЕНЕРАТОР: Найдено ${multiSelectNodes.length} узлов с множественным выбором:`, multiSelectNodes.map(n => n.id));
  return multiSelectNodes;
}