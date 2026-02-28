/**
 * @fileoverview Генерация обработчика рассылки (broadcast)
 *
 * Этот модуль предоставляет функции для генерации Python-кода,
 * реализующего рассылку сообщений пользователям из базы данных.
 * Поддерживает рассылку нескольких message узлов с флагом enableBroadcast.
 *
 * @module generateBroadcastHandler
 */

import { Node } from '@shared/schema';
import { generateBroadcastInline } from './generateBroadcastInline';
import { addGeneratedComment } from '../../utils/generateGeneratedComment';

/**
 * Генерирует отдельную функцию обработчика рассылки
 *
 * @param {Node} node - Узел типа broadcast
 * @param {Node[]} allNodes - Все узлы проекта для поиска message узлов с enableBroadcast
 * @param {boolean} enableComments - Включить ли комментарии в коде
 * @returns {string} Сгенерированный Python-код
 */
export function generateBroadcastHandler(node: Node, allNodes: Node[], enableComments: boolean = true): string {
  const codeLines: string[] = [];

  const safeNodeId = node.id.replace(/[^a-zA-Z0-9_]/g, '_');

  codeLines.push(`\n# @@NODE_START:${node.id}@@`);
  codeLines.push(`async def handle_broadcast_${safeNodeId}(callback_query, user_id):`);
  codeLines.push(`    # Обработчик рассылки для узла ${node.id}`);
  codeLines.push(generateBroadcastInline(node, allNodes, '    '));
  codeLines.push(`\n# @@NODE_END:${node.id}@@`);

  const code = codeLines.join('\n');

  // Используем утилиту для добавления комментария о генерации
  return enableComments
    ? addGeneratedComment(code, 'generateBroadcastHandler.ts', 'Генерация обработчика рассылки')
    : code;
}

// Ре-экспорт функций из новых модулей для обратной совместимости
export { generateBroadcastInline } from './generateBroadcastInline';
export { generateMultiMessageBroadcast } from './generateMultiMessageBroadcast';
