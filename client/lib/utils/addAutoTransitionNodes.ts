import { isLoggingEnabled } from '../bot-generator';

/**
   * Вспомогательная функция для добавления целевых узлов автоперехдов
   * @param {any[]} nodes - Массив узлов для обработки
   * @param {Set<string>} allReferencedNodeIds - Множество идентификаторов узлов для обновления
   */
export function addAutoTransitionNodes(nodes: any[], allReferencedNodeIds: Set<string>): void {
  const loggingEnabled = isLoggingEnabled();

  (nodes || [])
    .filter(node => node !== null && node !== undefined) // Фильтруем null/undefined узлы
    .forEach(node => {
    if (node.data?.enableAutoTransition && node.data?.autoTransitionTo) {
      allReferencedNodeIds.add(node.data.autoTransitionTo);
      if (loggingEnabled) {
        console.log(`✅ ГЕНЕРАТОР: Добавлен autoTransitionTo ${node.data.autoTransitionTo} в allReferencedNodeIds`);
      }
    }
  });
}
