// Функция для проверки наличия узлов с множественным выбором
export function hasMultiSelectNodes(nodes: Node[]): boolean {
  if (!nodes || nodes.length === 0) return false;
  return nodes.some(node => node.data.allowMultipleSelection);
}
