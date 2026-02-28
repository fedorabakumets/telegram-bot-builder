/**
 * @fileoverview Генерация списка сообщений для рассылки с enableBroadcast=true
 *
 * Этот модуль генерирует Python-код для формирования списка message узлов,
 * у которых установлен флаг enableBroadcast=true. Используется внутри
 * generateBroadcastInline для подготовки данных рассылки.
 *
 * @module generateMultiMessageBroadcast
 */

import { Node } from '@shared/schema';
import { formatTextForPython } from '../../format';
import { processCodeWithAutoComments } from '../../utils/generateGeneratedComment';

/**
 * Генерирует код для рассылки нескольких message узлов с enableBroadcast=true
 *
 * @param {Node[]} nodes - Все узлы проекта
 * @param {string} broadcastNodeId - ID текущего broadcast узла
 * @param {string} indent - Отступ для кода
 * @returns {string} Сгенерированный Python-код
 */
export function generateMultiMessageBroadcast(nodes: Node[], broadcastNodeId: string, indent: string = '    '): string {
  const codeLines: string[] = [];

  // Находим все message узлы с enableBroadcast=true
  const broadcastNodes = nodes.filter(n => {
    const nodeData = n.data as any;
    return n.type === 'message' &&
      nodeData?.enableBroadcast === true &&
      (!nodeData?.broadcastTargetNode || nodeData.broadcastTargetNode === 'all' || nodeData.broadcastTargetNode === broadcastNodeId)
  });

  if (broadcastNodes.length === 0) {
    codeLines.push(`${indent}# Нет сообщений для рассылки с enableBroadcast=true`);
    codeLines.push(`${indent}broadcast_nodes = []`);
    return codeLines.join('\n');
  }

  codeLines.push(`${indent}# Рассылка нескольких сообщений с enableBroadcast=true`);
  codeLines.push(`${indent}broadcast_nodes = [`);

  broadcastNodes.forEach(node => {
    const messageText = node.data?.messageText || '';
    const attachedMedia = node.data?.attachedMedia || [];
    const imageUrl = node.data?.imageUrl || '';
    const autoTransitionTo = node.data?.autoTransitionTo || '';
    const mediaStr = attachedMedia.length > 0 ? JSON.stringify(attachedMedia) : '[]';
    const imageUrlStr = imageUrl ? `"${imageUrl}"` : '""';
    const autoTransitionStr = autoTransitionTo ? `"${autoTransitionTo}"` : '""';
    codeLines.push(`${indent}    {"id": "${node.id}", "text": ${formatTextForPython(messageText)}, "attachedMedia": ${mediaStr}, "imageUrl": ${imageUrlStr}, "autoTransitionTo": ${autoTransitionStr}},`);
  });

  codeLines.push(`${indent}]`);

  // Применяем автоматическое добавление комментариев
  const processedCode = processCodeWithAutoComments(codeLines, 'generateMultiMessageBroadcast.ts');
  return processedCode.join('\n');
}
