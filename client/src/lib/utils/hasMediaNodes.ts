import { BotNode } from "../bot-generator";

// Функция для проверки наличия медиа-файлов
export function hasMediaNodes(nodes: BotNode[]): boolean {
  if (!nodes || nodes.length === 0) return false;
  return nodes.some(node => node.type === 'animation'
  );
}
