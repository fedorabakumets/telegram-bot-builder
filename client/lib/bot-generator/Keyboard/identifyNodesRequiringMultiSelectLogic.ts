/**
 * Идентифицирует узлы, требующие логики множественного выбора
 * @param nodes - массив узлов
 * @param isLoggingEnabled - функция проверки включения логирования
 * @returns массив узлов с включенным множественным выбором
 */
export function identifyNodesRequiringMultiSelectLogic(nodes: any[], isLoggingEnabled: () => boolean) {
  const multiSelectNodes = (nodes || [])
    .filter(node => node !== null && node !== undefined) // Фильтруем null/undefined узлы
    .filter((node: any) => node.data?.allowMultipleSelection);
  if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔍 ГЕНЕРАТОР: Найдено ${multiSelectNodes.length} узлов с множественным выбором:`, multiSelectNodes.map((n: any) => n.id));
  return multiSelectNodes;
}