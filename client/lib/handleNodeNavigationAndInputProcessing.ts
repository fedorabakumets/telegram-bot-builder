/**
 * @fileoverview Устаревший файл навигации по узлам
 *
 * @deprecated Используйте модуль `client/lib/node-navigation` вместо этого файла.
 * Этот файл сохранён для обратной совместимости и делегирует логику новым модулям.
 *
 * @see client/lib/node-navigation/handle-node-navigation.ts
 */

import type { Node, Connection } from '@shared/schema';
import { handleNodeNavigation } from './node-navigation/handle-node-navigation';

/**
 * Генерирует код для навигации по узлам графа бота
 * @param nodes - Массив узлов для навигации
 * @param code - Начальная строка кода (не используется, оставлен для совместимости)
 * @param conditionIndent - Отступ для условий (if/elif)
 * @param bodyIndent - Отступ для тела блока
 * @param allNodeIds - Массив всех ID узлов
 * @param connections - Массив соединений между узлами
 * @returns Строка с Python-кодом навигации
 *
 * @deprecated Используйте `handleNodeNavigation` из `client/lib/node-navigation`
 */
export function handleNodeNavigationAndInputProcessing(
  nodes: Node[],
  code: string,
  conditionIndent: string,
  bodyIndent: string,
  allNodeIds: string[],
  connections: Connection[]
): string {
  return handleNodeNavigation(
    nodes,
    conditionIndent,
    bodyIndent,
    allNodeIds,
    connections
  );
}
