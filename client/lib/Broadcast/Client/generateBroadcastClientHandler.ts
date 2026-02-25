/**
 * @fileoverview Генерация обработчика рассылки через Client API (Userbot)
 *
 * Этот модуль предоставляет функции для генерации Python-кода,
 * реализующего рассылку сообщений через Telegram Client API (Telethon).
 * Позволяет отправлять сообщения пользователям, которые не писали боту.
 *
 * @module generateBroadcastClientHandler
 */

import { Node } from '@shared/schema';
import { generateBroadcastClientInline } from './generateBroadcastClientInline';
import { addGeneratedComment } from '../../utils/generateGeneratedComment';

/**
 * Генерирует отдельную функцию обработчика рассылки через Client API
 *
 * @param {Node} node - Узел типа broadcast
 * @param {Node[]} allNodes - Все узлы проекта для поиска message узлов с enableBroadcast
 * @param {boolean} enableComments - Включить комментарии
 * @returns {string} Сгенерированный Python-код
 */
export function generateBroadcastClientHandler(node: Node, allNodes: Node[], enableComments: boolean = true): string {
  const codeLines: string[] = [];
  const safeNodeId = node.id.replace(/-/g, '_');

  codeLines.push(`async def handle_broadcast_client_${safeNodeId}(callback_query, user_id):`);
  codeLines.push(`    # Обработчик рассылки через Client API для узла ${node.id}`);
  codeLines.push(generateBroadcastClientInline(node, allNodes, '    '));

  const code = codeLines.join('\n');

  // Используем утилиту для добавления комментария о генерации
  return enableComments
    ? addGeneratedComment(code, 'generateBroadcastClientHandler.ts', 'Генерация обработчика рассылки через Client API')
    : code;
}

// Ре-экспорт функций из новых модулей для обратной совместимости
export { generateBroadcastClientInline } from './generateBroadcastClientInline';
export { generateBroadcastClientMultiMessage } from './generateBroadcastClientMultiMessage';
