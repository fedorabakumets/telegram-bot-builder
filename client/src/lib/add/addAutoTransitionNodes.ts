import { isLoggingEnabled } from './bot-generator';

/**
 * Вспомогательная функция для добавления целевых узлов автоперехдов
 * @param {any[]} nodes - Массив узлов для обработки
 * @param {Set<string>} allReferencedNodeIds - Множество идентификаторов узлов для обновления
 */
export function addAutoTransitionNodes(nodes: any[], allReferencedNodeIds: Set<string>): void {
  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Добавляем узлы, которые являются целями автопереходов
  (nodes || []).forEach(node => {
    if (node.data.enableAutoTransition && node.data.autoTransitionTo) {
      allReferencedNodeIds.add(node.data.autoTransitionTo);
      if (isLoggingEnabled()) isLoggingEnabled() && console.log(`✅ ГЕНЕРАТОР: Добавлен autoTransitionTo ${node.data.autoTransitionTo} в allReferencedNodeIds`);
    }
  });
}
