import { isLoggingEnabled } from '../../bot-generator';
import { collectMediaVariables } from './collectMediaVariables';

/**
 * Вспомогательная функция для извлечения идентификаторов узлов и карты медиапеременных
 * @param {any[]} nodes - Массив узлов для извлечения данных
 * @returns {{allNodeIds: string[], mediaVariablesMap: Map<string, string>}} Объект с идентификаторами узлов и картой медиапеременных
 */
export function extractNodeData(nodes: any[]) {
  // Собираем все ID узлов для генерации уникальных коротких ID
  const allNodeIds = nodes ? nodes.map(node => node.id) : [];

  // Собираем все медиапеременные из узлов для поддержки attachedMedia
  const mediaVariablesMap = collectMediaVariables(nodes || []);
  if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Собрано медиапеременных: ${mediaVariablesMap.size}`);
  if (mediaVariablesMap.size > 0) {
    if (isLoggingEnabled()) isLoggingEnabled() && console.log('🔧 ГЕНЕРАТОР: Медиапеременные:', Array.from(mediaVariablesMap.entries()));
  }

  return { allNodeIds, mediaVariablesMap };
}
