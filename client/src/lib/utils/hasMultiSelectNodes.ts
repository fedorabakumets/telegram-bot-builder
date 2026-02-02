import { BotNode } from "../types/bot-node";

// Функция для проверки наличия узлов с множественным выбором
export function hasMultiSelectNodes(nodes: BotNode[]): boolean {
  if (!nodes || nodes.length === 0) return false;
  return nodes.some(node => node.data.allowMultipleSelection);
}
