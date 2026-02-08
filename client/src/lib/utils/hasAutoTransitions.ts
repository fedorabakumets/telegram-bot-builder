import { BotNode } from "../bot-generator";

// Функция для проверки наличия автопереходов
export function hasAutoTransitions(nodes: BotNode[]): boolean {
  if (!nodes || nodes.length === 0) return false;
  return nodes
    .filter(node => node !== null && node !== undefined) // Фильтруем null/undefined узлы
    .some(node => node.data?.enableAutoTransition && node.data?.autoTransitionTo);
}
