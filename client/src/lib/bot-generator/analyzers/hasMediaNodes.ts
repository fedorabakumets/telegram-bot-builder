import { Node } from '@shared/schema';

// Функция для проверки наличия медиа-файлов
export function hasMediaNodes(nodes: Node[]): boolean {
  if (!nodes || nodes.length === 0) return false;
  return nodes.some(node => node.type === 'animation'
  );
}
